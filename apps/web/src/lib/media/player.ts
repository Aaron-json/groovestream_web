import { CDN_URL } from "@/api/api";
import type { Audiofile } from "@groovestream/api/models";
import { createEncodingToken } from "@groovestream/api/sdk";
import {
  resolvePlaybackItems,
  type MediaPreferences,
  type PlaybackItem,
} from "@groovestream/media/encodings";
import {
  getNextAudioIndex,
  type AudioSource,
} from "@groovestream/media/source";
import {
  INITIAL_PLAYBACK_STATE,
  UnsupportedPlaybackError,
  playbackStatesEqual,
  toUnloadedPlaybackState,
  updateCurrentMediaLocation,
  type CurrentMedia,
  type MediaPlayer,
  type PlaybackState,
} from "@groovestream/media/player";

const INITIAL_VOLUME = 0.7;
const WEB_CODEC_SUPPORT = [
  { codec: "opus", mimeType: 'audio/mp4; codecs="opus"' },
  { codec: "aac", mimeType: 'audio/mp4; codecs="mp4a.40.2"' },
] as const;

type CdnAuthorization = {
  encodingId: string;
  token: string;
  refreshPromise?: Promise<void>;
};

export default class WebAudioPlayer implements MediaPlayer {
  private videoElement: HTMLVideoElement | null = null;
  private shakaPlayer: shaka.Player | undefined;
  private cdnAuthorization: CdnAuthorization | undefined;
  private readonly stateListeners = new Set<() => void>();
  private state: PlaybackState = {
    ...INITIAL_PLAYBACK_STATE,
    volume: INITIAL_VOLUME,
  };
  private unsubscribeFromSource: (() => void) | undefined;
  private activeLoadController: AbortController | undefined;
  private mediaPreferences: MediaPreferences | undefined;

  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    const browser = window as typeof window & {
      ManagedMediaSource?: typeof MediaSource;
    };
    // CDN authorization depends on Shaka's request filters, not native HLS.
    return Boolean(browser.MediaSource || browser.ManagedMediaSource);
  }

  getState(): PlaybackState {
    return this.state;
  }

  subscribeToState(listener: () => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  async init(): Promise<void> {
    if (this.shakaPlayer) throw new Error("Player already initialized");
    if (typeof document === "undefined") {
      throw new Error("The web player requires a browser environment");
    }

    const shakaModule =
      await import("shaka-player/dist/shaka-player.compiled.js");
    const shaka = shakaModule.default || shakaModule;

    shaka.polyfill.installAll();
    if (!shaka.Player.isBrowserSupported()) {
      throw new Error(
        "This browser does not support necessary media features. Please update or use a different browser",
      );
    }
    const browserSupport = await shaka.Player.probeSupport(false);
    this.mediaPreferences = {
      codecs: WEB_CODEC_SUPPORT.filter(
        ({ mimeType }) => browserSupport.media[mimeType],
      ).map(({ codec }) => codec),
      deliveries: ["dash", "hls"],
    };

    const videoElement = document.createElement("video");
    videoElement.playsInline = true;
    videoElement.style.display = "none";
    videoElement.volume = INITIAL_VOLUME;
    document.body.appendChild(videoElement);

    const shakaPlayer = new shaka.Player();
    try {
      await shakaPlayer.attach(videoElement);
    } catch (error) {
      await shakaPlayer.destroy();
      videoElement.remove();
      this.mediaPreferences = undefined;
      throw error;
    }
    this.videoElement = videoElement;
    this.shakaPlayer = shakaPlayer;
    this.setPlaybackState({
      ...this.state,
      volume: videoElement.volume,
      muted: videoElement.muted,
    });

    this.configureNetworking(shaka);
    this.registerEventListeners();
  }

  load(source: AudioSource, audiofileId: Audiofile["id"]): Promise<void> {
    return this.runExclusiveLoad((signal) =>
      this.loadAudiofile(source, audiofileId, signal),
    );
  }

  next(): Promise<void> {
    return this.navigate("next");
  }

  previous(): Promise<void> {
    return this.navigate("prev");
  }

  unload() {
    this.resetPlayback();
    void this.shakaPlayer?.unload().catch((error) => {
      console.error("Unable to unload media", error);
    });
  }

  async destroy() {
    this.resetPlayback();

    if (this.shakaPlayer) {
      await this.shakaPlayer.destroy();
      this.shakaPlayer = undefined;
    }

    this.videoElement?.remove();
    this.videoElement = null;
    this.mediaPreferences = undefined;
    this.stateListeners.clear();
  }

  async play() {
    if (!this.videoElement) throw new Error("Player not initialized");
    await this.videoElement.play();
  }

  pause() {
    this.videoElement?.pause();
  }

  setVolume(volume: number) {
    if (this.videoElement) this.videoElement.volume = volume;
  }

  setMute(mute: boolean) {
    if (this.videoElement) this.videoElement.muted = mute;
  }

  async seek(position: number) {
    if (!this.videoElement) return;
    this.videoElement.currentTime = position;
    if (this.state.status === "playing" || this.state.status === "paused") {
      this.setPlaybackState({ ...this.state, position });
    }
  }

  private setPlaybackState(nextState: PlaybackState) {
    if (playbackStatesEqual(this.state, nextState)) return;
    this.state = nextState;
    this.stateListeners.forEach((listener) => listener());
  }

  private resetPlayback() {
    this.activeLoadController?.abort();
    this.activeLoadController = undefined;
    this.cdnAuthorization = undefined;
    this.clearSourceSubscription();
    this.setPlaybackState(toUnloadedPlaybackState(this.state));
    this.videoElement?.pause();
  }

  private async runExclusiveLoad(
    loadMedia: (signal: AbortSignal) => Promise<void>,
  ) {
    this.activeLoadController?.abort();
    const controller = new AbortController();
    this.activeLoadController = controller;

    try {
      await loadMedia(controller.signal);
    } catch (error) {
      if (controller.signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      if (this.activeLoadController === controller) {
        this.resetPlayback();
        // Cleanup must not replace the load error reported to the caller.
        await this.shakaPlayer?.unload().catch(() => {});
      }
      throw error;
    } finally {
      if (this.activeLoadController === controller) {
        this.activeLoadController = undefined;
      }
    }
  }

  private clearSourceSubscription() {
    this.unsubscribeFromSource?.();
    this.unsubscribeFromSource = undefined;
  }

  private subscribeToSource(source: AudioSource) {
    const currentSource = this.state.currentMedia?.source;
    if (source === currentSource && this.unsubscribeFromSource) return;
    this.clearSourceSubscription();
    this.unsubscribeFromSource = source.subscribe(() =>
      this.handleSourceUpdate(),
    );
  }

  private handleSourceUpdate() {
    const state = this.state;
    const currentMedia = state.currentMedia;
    if (!currentMedia) return;

    const audiofiles = currentMedia.source.getAudiofiles();
    const index = audiofiles.findIndex(
      ({ id }) => id === currentMedia.audiofile.id,
    );
    // A removed item keeps playing. Its last known index is the stable cursor
    // used to choose a neighbor from the updated source.
    if (index === -1) return;
    const audiofile = audiofiles[index];
    if (index === currentMedia.index && audiofile === currentMedia.audiofile) {
      return;
    }

    this.setPlaybackState(updateCurrentMediaLocation(state, index, audiofile));
  }

  private async loadAudiofile(
    source: AudioSource,
    audiofileId: Audiofile["id"],
    signal: AbortSignal,
  ) {
    const shakaPlayer = this.shakaPlayer;
    const videoElement = this.videoElement;
    const mediaPreferences = this.mediaPreferences;
    if (!shakaPlayer || !videoElement || !mediaPreferences) {
      throw new Error("Player not initialized");
    }

    const audiofiles = source.getAudiofiles();
    const index = audiofiles.findIndex(
      (audiofile) => audiofile.id === audiofileId,
    );
    if (index === -1) {
      throw new Error("The selected track is no longer available");
    }

    const loadingMedia: CurrentMedia<undefined> = {
      source,
      index,
      audiofile: audiofiles[index],
      playbackItem: undefined,
    };
    videoElement.pause();
    this.cdnAuthorization = undefined;
    this.subscribeToSource(source);
    this.setPlaybackState({
      ...this.state,
      status: "loading",
      currentMedia: loadingMedia,
      position: 0,
      duration: 0,
    });

    await shakaPlayer.unload();
    signal.throwIfAborted();
    const [playbackItem] = await resolvePlaybackItems(
      loadingMedia.audiofile,
      mediaPreferences,
      signal,
    );
    if (!playbackItem) {
      throw new UnsupportedPlaybackError(loadingMedia.audiofile.id);
    }

    const { token } = await createEncodingToken({
      path: { encoding_id: playbackItem.encoding.id },
      signal,
    });
    signal.throwIfAborted();
    this.cdnAuthorization = {
      encodingId: playbackItem.encoding.id,
      token,
    };

    await shakaPlayer.load(playbackItem.objectId);
    signal.throwIfAborted();
    await videoElement.play();
    signal.throwIfAborted();

    if (this.state.status !== "loading") {
      throw new Error("Player left the loading state before media was ready");
    }
    const currentMedia: CurrentMedia = {
      ...this.state.currentMedia,
      playbackItem,
    };
    this.setPlaybackState({
      ...this.state,
      status: "playing",
      currentMedia,
      position: videoElement.currentTime,
      duration: videoElement.duration || 0,
      volume: videoElement.volume,
      muted: videoElement.muted,
    });
  }

  private async getNavigationTarget(
    source: AudioSource,
    cursor: CurrentMedia<PlaybackItem | undefined>,
    direction: "next" | "prev",
    signal: AbortSignal,
  ) {
    let audiofiles = source.getAudiofiles();
    let index = getNextAudioIndex(
      audiofiles,
      cursor.audiofile.id,
      direction,
      cursor.index,
      false,
    );

    while (
      direction === "next" &&
      index === undefined &&
      source.pagination?.hasMore()
    ) {
      const previousLength = audiofiles.length;
      await source.pagination.loadMore();
      signal.throwIfAborted();
      audiofiles = source.getAudiofiles();
      index = getNextAudioIndex(
        audiofiles,
        cursor.audiofile.id,
        direction,
        cursor.index,
        false,
      );
      if (audiofiles.length === previousLength) break;
    }

    if (index === undefined && !source.pagination?.hasMore()) {
      index = getNextAudioIndex(
        audiofiles,
        cursor.audiofile.id,
        direction,
        cursor.index,
      );
    }
    if (index === undefined) return undefined;
    const audiofile = audiofiles[index];
    if (!audiofile || audiofile.id === cursor.audiofile.id) {
      return undefined;
    }
    return { audiofile, index };
  }

  private async navigate(direction: "next" | "prev") {
    const currentMedia = this.state.currentMedia;
    if (!currentMedia) return;
    const source = currentMedia.source;

    await this.runExclusiveLoad(async (signal) => {
      if (source.getAudiofiles().length === 0) {
        throw new Error("The playback queue is no longer available");
      }

      const visitedAudiofileIds = new Set<Audiofile["id"]>([
        currentMedia.audiofile.id,
      ]);
      let navigationCursor: CurrentMedia<PlaybackItem | undefined> =
        currentMedia;
      let unsupportedPlaybackError: UnsupportedPlaybackError | undefined;

      while (true) {
        const navigationTarget = await this.getNavigationTarget(
          source,
          navigationCursor,
          direction,
          signal,
        );
        if (
          !navigationTarget ||
          visitedAudiofileIds.has(navigationTarget.audiofile.id)
        ) {
          if (unsupportedPlaybackError) throw unsupportedPlaybackError;
          return;
        }
        visitedAudiofileIds.add(navigationTarget.audiofile.id);

        try {
          await this.loadAudiofile(
            source,
            navigationTarget.audiofile.id,
            signal,
          );
          return;
        } catch (error) {
          if (!(error instanceof UnsupportedPlaybackError)) throw error;
          unsupportedPlaybackError = error;
          navigationCursor = {
            source,
            index: navigationTarget.index,
            audiofile: navigationTarget.audiofile,
            playbackItem: undefined,
          };
        }
      }
    });
  }

  private configureNetworking(shakaModule: typeof shaka) {
    const shakaPlayer = this.shakaPlayer;
    if (!shakaPlayer) return;
    const networkingEngine = shakaPlayer.getNetworkingEngine();
    if (!networkingEngine) return;

    networkingEngine.registerRequestFilter((requestType, request) => {
      if (
        requestType !== shakaModule.net.NetworkingEngine.RequestType.MANIFEST &&
        requestType !== shakaModule.net.NetworkingEngine.RequestType.SEGMENT
      ) {
        return;
      }

      const mediaUrl = new URL(request.uris[0], window.location.href);
      const objectKey = mediaUrl.pathname.split("/").pop();
      if (!objectKey) throw new Error("Media URL has no object key");
      request.uris[0] = new URL(objectKey, `${CDN_URL}/`).href;

      const authorization = this.cdnAuthorization;
      if (authorization) {
        request.headers["Authorization"] = `Bearer ${authorization.token}`;
      }
    });

    shakaPlayer.configure(
      "streaming.failureCallback",
      async (error: shaka.util.Error) => {
        const authorization = this.cdnAuthorization;
        if (!authorization || !this.isUnauthorizedCdnRequest(error)) return;

        if (!authorization.refreshPromise) {
          authorization.refreshPromise = createEncodingToken({
            path: { encoding_id: authorization.encodingId },
          })
            .then(({ token }) => {
              if (this.cdnAuthorization !== authorization) return;
              authorization.token = token;
              shakaPlayer.retryStreaming();
            })
            .catch((refreshError) => {
              if (this.cdnAuthorization === authorization) {
                this.failPlayback(refreshError);
              }
            })
            .finally(() => {
              authorization.refreshPromise = undefined;
            });
        }

        await authorization.refreshPromise;
      },
    );
  }

  private isUnauthorizedCdnRequest(error: shaka.util.Error | undefined) {
    const [url, status] = error?.data ?? [];
    return (
      typeof url === "string" &&
      (url === CDN_URL || url.startsWith(`${CDN_URL}/`)) &&
      status === 401
    );
  }

  private failPlayback(error: unknown) {
    console.error("Playback failed after loading completed", error);
    this.unload();
  }

  private registerEventListeners() {
    const videoElement = this.videoElement;
    const shakaPlayer = this.shakaPlayer;
    if (!videoElement || !shakaPlayer) return;

    videoElement.addEventListener("ended", () => {
      void this.next().catch((error) => {
        if (!(error instanceof Error && error.name === "AbortError")) {
          console.error("Unable to advance playback", error);
        }
      });
    });
    videoElement.addEventListener("play", () => {
      if (this.state.status !== "paused") return;
      this.setPlaybackState({ ...this.state, status: "playing" });
    });
    videoElement.addEventListener("pause", () => {
      if (this.state.status !== "playing") return;
      this.setPlaybackState({ ...this.state, status: "paused" });
    });
    videoElement.addEventListener("volumechange", () => {
      this.setPlaybackState({
        ...this.state,
        volume: videoElement.volume,
        muted: videoElement.muted,
      });
    });
    videoElement.addEventListener("timeupdate", () => {
      if (this.state.status !== "playing" && this.state.status !== "paused") {
        return;
      }
      this.setPlaybackState({
        ...this.state,
        position: videoElement.currentTime,
        duration: videoElement.duration || 0,
      });
    });
    shakaPlayer.addEventListener("error", (event) => {
      const error = (event as Event & { detail: shaka.util.Error }).detail;
      // Shaka emits this event and rejects load() for the same manifest error.
      // The active load owns that failure and resets state through its rejection.
      if (
        this.state.status !== "loading" &&
        !this.isUnauthorizedCdnRequest(error)
      ) {
        this.failPlayback(error);
      }
    });
  }
}
