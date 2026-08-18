import type { Audiofile } from "@groovestream/api/models";
import { createEncodingToken } from "@groovestream/api/sdk";
import {
  resolvePlaybackItems,
  type MediaPreferences,
  type PlaybackItem,
} from "@groovestream/media/encodings";
import {
  UnsupportedPlaybackError,
  playbackStatesEqual,
  toUnloadedPlaybackState,
  updateCurrentMediaLocation,
  type CurrentMedia,
  type MediaPlayer,
  type PlaybackState,
} from "@groovestream/media/player";
import {
  getNextAudioIndex,
  type AudioSource,
} from "@groovestream/media/source";
import {
  createAudioPlaylist,
  type AudioPlaylist,
  type AudioPlaylistStatus,
  type AudioSource as NativeAudioSource,
} from "expo-audio";
import { AppState, Platform } from "react-native";
import { env } from "@/lib/env";

const DEFAULT_VOLUME = 0.8;
const NATIVE_PREFERENCES = Platform.select<MediaPreferences>({
  android: {
    codecs: ["opus", "aac"],
    deliveries: ["dash", "hls"],
  },
  ios: {
    codecs: ["aac"],
    deliveries: ["hls"],
  },
  default: {
    codecs: ["aac"],
    deliveries: ["hls"],
  },
});

type PreparedTrack = {
  audiofile: Audiofile;
  playbackItem: PlaybackItem;
  source: NativeAudioSource;
};

type RemovableSubscription = { remove(): void };
type NativeStatus = AudioPlaylistStatus & {
  error?: { message?: string; code?: number };
};

class PlaybackCancelledError extends Error {
  override name = "AbortError";
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw new PlaybackCancelledError();
}

export type TrackLoaderContext = {
  audiofile: Audiofile;
  playbackItem: PlaybackItem;
  signal: AbortSignal;
};

export type TrackLoaderResult = {
  uri: string;
  headers?: Record<string, string>;
};

export type TrackLoaderInterceptor = (
  context: TrackLoaderContext,
  next: (ctx: TrackLoaderContext) => Promise<TrackLoaderResult>,
) => Promise<TrackLoaderResult>;

const defaultTrackLoader = async ({
  playbackItem,
  signal,
}: TrackLoaderContext): Promise<TrackLoaderResult> => {
  const { token } = await createEncodingToken({
    path: { encoding_id: playbackItem.encoding.id },
    signal,
  });
  throwIfAborted(signal);
  return {
    uri: `${env.cdnUrl.replace(/\/$/, "")}/${playbackItem.objectId}`,
    headers: { Authorization: `Bearer ${token}` },
  };
};

let loaderInterceptors: TrackLoaderInterceptor[] = [];

export function addTrackLoaderInterceptor(
  interceptor: TrackLoaderInterceptor,
): () => void {
  loaderInterceptors.push(interceptor);
  return () => {
    loaderInterceptors = loaderInterceptors.filter(
      (item) => item !== interceptor,
    );
  };
}

export function setTrackLoaderInterceptors(
  interceptors: TrackLoaderInterceptor[],
): void {
  loaderInterceptors = [...interceptors];
}

export function clearTrackLoaderInterceptors(): void {
  loaderInterceptors = [];
}

async function executeLoaderChain(
  context: TrackLoaderContext,
): Promise<TrackLoaderResult> {
  // A load sees one stable chain even if registration changes while an
  // asynchronous interceptor is running.
  const interceptors = [...loaderInterceptors];
  let index = -1;
  const dispatch = async (
    nextIndex: number,
    nextContext: TrackLoaderContext,
  ): Promise<TrackLoaderResult> => {
    if (nextIndex <= index) throw new Error("next() called multiple times");
    index = nextIndex;
    const interceptor = interceptors[nextIndex];
    if (interceptor) {
      return await interceptor(nextContext, (forwardedContext) =>
        dispatch(nextIndex + 1, forwardedContext),
      );
    }
    return await defaultTrackLoader(nextContext);
  };
  return await dispatch(0, context);
}

function uniqueAudiofiles(audiofiles: readonly Audiofile[]) {
  const seen = new Set<Audiofile["id"]>();
  return audiofiles.filter((audiofile) => {
    if (seen.has(audiofile.id)) return false;
    seen.add(audiofile.id);
    return true;
  });
}

class NativeAudioPlayer implements MediaPlayer {
  private playlist: AudioPlaylist | undefined;
  private playlistSubscription: RemovableSubscription | undefined;
  private appStateSubscription: RemovableSubscription | undefined;
  private readonly stateListeners = new Set<() => void>();
  private state: PlaybackState = {
    status: "unloaded",
    currentMedia: undefined,
    position: 0,
    duration: 0,
    volume: DEFAULT_VOLUME,
    muted: false,
  };

  // Expo's queue contains only native playback sources. This parallel array
  // retains the application metadata needed to hydrate PlaybackState.
  private preparedTracks: PreparedTrack[] = [];
  private activeSource: AudioSource | undefined;
  private sourceUnsubscribe: (() => void) | undefined;
  private sourceController: AbortController | undefined;
  private attemptedIds = new Set<Audiofile["id"]>();
  private forwardCursor:
    | { id: Audiofile["id"]; index: number }
    | undefined;
  private appendPromise: Promise<void> | undefined;
  private appendBlocked = false;
  private appendError: unknown;
  private lastNativeIndex: number | undefined;
  private preparingAudiofileId: Audiofile["id"] | undefined;
  private playIntent = false;

  isSupported() {
    return true;
  }

  getState(): PlaybackState {
    return this.state;
  }

  subscribeToState(listener: () => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  async init() {
    if (this.playlist) throw new Error("Player already initialized");

    const playlist = createAudioPlaylist({
      sources: [],
      updateInterval: 500,
      loop: "none",
    });
    playlist.volume = DEFAULT_VOLUME;
    this.playlist = playlist;
    this.playlistSubscription = playlist.addListener(
      "playlistStatusUpdate",
      (status) => this.handlePlaylistStatus(status),
    );
    this.appStateSubscription = AppState.addEventListener(
      "change",
      (appState) => {
        if (appState === "active" && this.playlist === playlist) {
          // Native playback can advance while JS is suspended. Pulling one
          // authoritative snapshot is safer than assuming missed events replay.
          this.handlePlaylistStatus(playlist.currentStatus);
        }
      },
    );
    this.handlePlaylistStatus(playlist.currentStatus);
  }

  async load(source: AudioSource, audiofileId: Audiofile["id"]) {
    const playlist = this.requirePlaylist();
    const loaded = uniqueAudiofiles(source.getAudiofiles());
    const selectedIndex = loaded.findIndex(({ id }) => id === audiofileId);
    if (selectedIndex === -1) {
      this.unload();
      throw new Error("The selected track is no longer available");
    }

    this.sourceController?.abort();
    const controller = new AbortController();
    this.sourceController = controller;
    this.preparingAudiofileId = audiofileId;
    this.resetPreparedQueue();
    this.playIntent = false;

    const selection: CurrentMedia<undefined> = {
      source,
      index: selectedIndex,
      audiofile: loaded[selectedIndex],
      playbackItem: undefined,
    };
    this.setActiveSource(source);
    this.setState({
      status: "loading",
      currentMedia: selection,
      position: 0,
      duration: 0,
      volume: playlist.volume,
      muted: playlist.muted,
    });
    playlist.pause();
    playlist.clear();
    playlist.loop = "none";

    try {
      const selected = await this.prepareTrack(
        selection.audiofile,
        controller.signal,
      );
      throwIfAborted(controller.signal);
      if (!selected) throw new UnsupportedPlaybackError(audiofileId);

      this.attemptedIds.add(selected.audiofile.id);
      this.forwardCursor = { id: selected.audiofile.id, index: selectedIndex };
      this.preparedTracks = [selected];
      this.lastNativeIndex = 0;

      playlist.add(selected.source);
      playlist.skipTo(0);
      this.playIntent = true;
      playlist.play();

      const loadingMedia = this.state.currentMedia;
      const selectedMedia =
        this.state.status === "loading" &&
        loadingMedia?.source === source &&
        loadingMedia.audiofile.id === audiofileId
          ? loadingMedia
          : selection;
      this.setState({
        status: "playing",
        currentMedia: {
          ...selectedMedia,
          audiofile: selected.audiofile,
          playbackItem: selected.playbackItem,
        },
        position: 0,
        duration: playlist.duration,
        volume: playlist.volume,
        muted: playlist.muted,
      });
      this.preparingAudiofileId = undefined;
      this.maybeAppend(0);
    } catch (error) {
      if (this.sourceController !== controller || controller.signal.aborted) {
        throw new PlaybackCancelledError();
      }
      this.unload();
      throw error;
    } finally {
      if (this.sourceController === controller) {
        this.preparingAudiofileId = undefined;
      }
    }
  }

  async play() {
    const playlist = this.requirePlaylist();
    this.playIntent = true;
    playlist.play();
    if (this.state.status === "paused") {
      this.setState({ ...this.state, status: "playing" });
    }
  }

  pause() {
    this.playIntent = false;
    this.playlist?.pause();
    if (this.state.status === "playing") {
      this.setState({ ...this.state, status: "paused" });
    }
  }

  async next() {
    const playlist = this.requirePlaylist();
    this.appendBlocked = false;
    this.appendError = undefined;
    this.maybeAppend(playlist.currentIndex);
    await this.appendPromise;
    if (this.appendError) throw this.appendError;
    playlist.next();
  }

  async previous() {
    const playlist = this.requirePlaylist();
    if (playlist.currentTime > 3) {
      await this.seek(0);
      return;
    }
    if (playlist.currentIndex > 0 || playlist.loop === "all") {
      playlist.previous();
      return;
    }

    const source = this.activeSource;
    const current = this.state.currentMedia;
    if (!source || !current) return;
    const audiofiles = uniqueAudiofiles(source.getAudiofiles());
    let cursorId = current.audiofile.id;
    let cursorIndex = current.index;
    let unsupported: UnsupportedPlaybackError | undefined;

    while (true) {
      const previousIndex = getNextAudioIndex(
        audiofiles,
        cursorId,
        "prev",
        cursorIndex,
        false,
      );
      if (previousIndex === undefined) {
        if (unsupported) throw unsupported;
        return;
      }
      const candidate = audiofiles[previousIndex];
      try {
        await this.load(source, candidate.id);
        return;
      } catch (error) {
        if (!(error instanceof UnsupportedPlaybackError)) throw error;
        unsupported = error;
        cursorId = candidate.id;
        cursorIndex = previousIndex;
      }
    }
  }

  async seek(position: number) {
    const playlist = this.requirePlaylist();
    await playlist.seekTo(position);
    if (this.state.status === "playing" || this.state.status === "paused") {
      this.setState({ ...this.state, position });
    }
  }

  unload() {
    this.sourceController?.abort();
    this.sourceController = undefined;
    this.setActiveSource(undefined);
    this.resetPreparedQueue();
    this.preparingAudiofileId = undefined;
    this.playIntent = false;
    this.setUnloaded();

    if (this.playlist) {
      this.playlist.pause();
      this.playlist.clear();
      this.playlist.loop = "none";
    }
  }

  async destroy() {
    const playlist = this.playlist;
    this.unload();
    this.playlistSubscription?.remove();
    this.playlistSubscription = undefined;
    this.appStateSubscription?.remove();
    this.appStateSubscription = undefined;
    playlist?.destroy();
    this.playlist = undefined;
    this.stateListeners.clear();
  }

  setVolume(volume: number) {
    if (this.playlist) this.playlist.volume = volume;
    this.setState({ ...this.state, volume });
  }

  setMute(muted: boolean) {
    if (this.playlist) this.playlist.muted = muted;
    this.setState({ ...this.state, muted });
  }

  private requirePlaylist() {
    if (!this.playlist) throw new Error("The audio player is not ready");
    return this.playlist;
  }

  private setState(nextState: PlaybackState) {
    if (playbackStatesEqual(this.state, nextState)) return;
    this.state = nextState;
    this.stateListeners.forEach((listener) => listener());
  }

  private setUnloaded() {
    this.setState(toUnloadedPlaybackState(this.state));
  }

  private resetPreparedQueue() {
    this.appendPromise = undefined;
    this.preparedTracks = [];
    this.attemptedIds.clear();
    this.forwardCursor = undefined;
    this.appendBlocked = false;
    this.appendError = undefined;
    this.lastNativeIndex = undefined;
  }

  private setActiveSource(source: AudioSource | undefined) {
    this.sourceUnsubscribe?.();
    this.sourceUnsubscribe = undefined;
    this.activeSource = source;
    if (!source) return;

    this.syncSourceAudiofiles();
    // Query-backed sources refresh their observer only while something holds a
    // subscription, so the player keeps its live navigation source attached.
    this.sourceUnsubscribe = source.subscribe(() => {
      this.syncSourceAudiofiles();
      const playlist = this.playlist;
      if (!playlist) return;
      if (source.getAudiofiles().some(({ id }) => !this.attemptedIds.has(id))) {
        playlist.loop = "none";
        this.appendBlocked = false;
        this.maybeAppend(playlist.currentIndex);
      }
    });
  }

  private syncSourceAudiofiles() {
    const source = this.activeSource;
    if (!source) return;
    const sourceAudiofiles = uniqueAudiofiles(source.getAudiofiles());
    const audiofilesById = new Map(
      sourceAudiofiles.map((audiofile) => [audiofile.id, audiofile]),
    );
    this.preparedTracks = this.preparedTracks.map((track) => ({
      ...track,
      audiofile: audiofilesById.get(track.audiofile.id) ?? track.audiofile,
    }));

    const state = this.state;
    const media = state.currentMedia;
    if (!media || media.source !== source) return;
    const index = sourceAudiofiles.findIndex(
      ({ id }) => id === media.audiofile.id,
    );
    if (index === -1) return;
    const audiofile = sourceAudiofiles[index];
    if (index === media.index && audiofile === media.audiofile) return;

    this.setState(updateCurrentMediaLocation(state, index, audiofile));
  }

  private async prepareTrack(
    audiofile: Audiofile,
    signal: AbortSignal,
  ): Promise<PreparedTrack | undefined> {
    try {
      const [playbackItem] = await resolvePlaybackItems(
        audiofile,
        NATIVE_PREFERENCES,
        signal,
      );
      throwIfAborted(signal);
      if (!playbackItem) return undefined;

      const loaded = await executeLoaderChain({
        audiofile,
        playbackItem,
        signal,
      });
      throwIfAborted(signal);
      return {
        audiofile,
        playbackItem,
        source: {
          uri: loaded.uri,
          headers: loaded.headers,
          name: audiofile.id,
        },
      };
    } catch (error) {
      if (signal.aborted) throw new PlaybackCancelledError();
      throw error;
    }
  }

  private getHydratedMedia(nativeIndex: number) {
    const track = this.preparedTracks[nativeIndex];
    const source = this.activeSource;
    if (!track || !source) return undefined;
    const sourceIndex = source
      .getAudiofiles()
      .findIndex(({ id }) => id === track.audiofile.id);
    const index =
      sourceIndex === -1
        ? (this.state.currentMedia?.index ?? nativeIndex)
        : sourceIndex;

    if (
      (this.state.status === "playing" || this.state.status === "paused") &&
      this.state.currentMedia.source === source &&
      this.state.currentMedia.index === index &&
      this.state.currentMedia.audiofile === track.audiofile &&
      this.state.currentMedia.playbackItem === track.playbackItem
    ) {
      return this.state.currentMedia;
    }
    return {
      source,
      index,
      audiofile: track.audiofile,
      playbackItem: track.playbackItem,
    } satisfies CurrentMedia;
  }

  private handlePlaylistStatus(status: NativeStatus) {
    if (status.error) {
      console.error("Native audio playback failed", status.error);
      this.unload();
      return;
    }

    if (status.currentIndex !== this.lastNativeIndex) {
      this.lastNativeIndex = status.currentIndex;
      this.appendBlocked = false;
    }

    if (this.preparingAudiofileId) {
      this.setState({
        ...this.state,
        volume: status.volume,
        muted: status.muted,
      });
      return;
    }

    const media = this.getHydratedMedia(status.currentIndex);
    if (media) {
      if (status.playing) this.playIntent = true;
      else if (!status.isBuffering) this.playIntent = false;
      const playbackStatus =
        status.playing || (status.isBuffering && this.playIntent)
          ? "playing"
          : "paused";
      this.setState({
        status: playbackStatus,
        currentMedia: media,
        position: status.currentTime,
        duration: status.duration,
        volume: status.volume,
        muted: status.muted,
      });
    } else {
      this.setState({
        ...this.state,
        volume: status.volume,
        muted: status.muted,
      });
    }
    this.maybeAppend(status.currentIndex);
  }

  private findNextCandidate(
    audiofiles: readonly Audiofile[],
    wrap: boolean,
  ) {
    const cursor = this.forwardCursor;
    if (!cursor) return undefined;

    let index = getNextAudioIndex(
      audiofiles,
      cursor.id,
      "next",
      cursor.index,
      wrap,
    );
    for (
      let checked = 0;
      index !== undefined && checked < audiofiles.length;
      checked++
    ) {
      const audiofile = audiofiles[index];
      if (!this.attemptedIds.has(audiofile.id)) return { audiofile, index };
      index = getNextAudioIndex(
        audiofiles,
        audiofile.id,
        "next",
        index,
        wrap,
      );
    }
  }

  private async appendNextTrack(
    playlist: AudioPlaylist,
    source: AudioSource,
    controller: AbortController,
  ) {
    throwIfAborted(controller.signal);

    while (true) {
      const loaded = uniqueAudiofiles(source.getAudiofiles());
      let candidate = this.findNextCandidate(loaded, false);

      if (!candidate && source.pagination?.hasMore()) {
        const before = loaded.length;
        await source.pagination.loadMore();
        throwIfAborted(controller.signal);
        const refreshed = uniqueAudiofiles(source.getAudiofiles());
        if (refreshed.length === before) return;
        candidate = this.findNextCandidate(refreshed, false);
      }

      candidate ??= this.findNextCandidate(
        uniqueAudiofiles(source.getAudiofiles()),
        true,
      );
      if (!candidate) {
        if (!source.pagination?.hasMore()) playlist.loop = "all";
        return;
      }

      const addition = await this.prepareTrack(
        candidate.audiofile,
        controller.signal,
      );
      throwIfAborted(controller.signal);
      this.attemptedIds.add(candidate.audiofile.id);
      this.forwardCursor = {
        id: candidate.audiofile.id,
        index: candidate.index,
      };

      // Unsupported representations are track-local, so queue advancement may
      // skip them without treating the entire source as failed.
      if (!addition) continue;
      playlist.add(addition.source);
      this.preparedTracks.push(addition);
      return;
    }
  }

  private maybeAppend(currentIndex: number) {
    const playlist = this.playlist;
    const source = this.activeSource;
    const controller = this.sourceController;
    if (!playlist || !source || !controller) return;
    if (this.preparingAudiofileId || this.appendBlocked) return;
    if (this.preparedTracks.length > currentIndex + 1 || this.appendPromise) {
      return;
    }

    const pending = this.appendNextTrack(playlist, source, controller)
      .then(() => {
        this.appendError = undefined;
      })
      .catch((error) => {
        if (!(error instanceof PlaybackCancelledError)) {
          this.appendBlocked = true;
          this.appendError = error;
          console.error("Unable to prepare the next native queue item", error);
        }
      })
      .finally(() => {
        if (this.appendPromise === pending) this.appendPromise = undefined;
      });
    this.appendPromise = pending;
  }
}

export const nativePlayer = new NativeAudioPlayer();
