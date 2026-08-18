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
  UnsupportedPlaybackError,
  playbackStatesEqual,
  toUnloadedPlaybackState,
  updateCurrentMediaLocation,
  type CurrentMedia,
  type MediaPlayer,
  type PlaybackState,
} from "@groovestream/media/player";

const DEFAULT_VOLUME = 0.7;
const WEB_CODECS = [
  { codec: "opus", mimeType: 'audio/mp4; codecs="opus"' },
  { codec: "aac", mimeType: 'audio/mp4; codecs="mp4a.40.2"' },
] as const;

type Authorization = {
  encodingId: string;
  token: string;
  refresh?: Promise<string>;
};

export default class WebAudioPlayer implements MediaPlayer {
  private videoElement: HTMLVideoElement | null = null;
  private player: shaka.Player | undefined;
  private authorization: Authorization | undefined;
  private readonly stateListeners = new Set<() => void>();
  private state: PlaybackState = {
    status: "unloaded",
    currentMedia: undefined,
    position: 0,
    duration: 0,
    volume: DEFAULT_VOLUME,
    muted: false,
  };
  private sourceUnsubscribe: (() => void) | undefined;
  private activeLoad: AbortController | undefined;
  private mediaPreferences: MediaPreferences | undefined;

  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!window.MediaSource || "WebKitMediaSource" in window;
  }

  getState(): PlaybackState {
    return this.state;
  }

  subscribeToState(listener: () => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  async init(): Promise<void> {
    if (this.player) throw new Error("Player already initialized");
    if (typeof document === "undefined") {
      throw new Error("The web player requires a browser environment");
    }

    const module = await import("shaka-player/dist/shaka-player.compiled.js");
    const shaka = module.default || module;

    shaka.polyfill.installAll();
    if (!shaka.Player.isBrowserSupported()) {
      throw new Error(
        "This browser does not support necessary media features. Please update or use a different browser",
      );
    }
    const support = await shaka.Player.probeSupport(false);
    this.mediaPreferences = {
      codecs: WEB_CODECS.filter(({ mimeType }) => support.media[mimeType]).map(
        ({ codec }) => codec,
      ),
      deliveries: ["dash", "hls"],
    };

    const videoElement = document.createElement("video");
    videoElement.playsInline = true;
    videoElement.style.display = "none";
    videoElement.volume = DEFAULT_VOLUME;
    document.body.appendChild(videoElement);

    const player = new shaka.Player();
    try {
      await player.attach(videoElement);
    } catch (error) {
      await player.destroy();
      videoElement.remove();
      this.mediaPreferences = undefined;
      throw error;
    }
    this.videoElement = videoElement;
    this.player = player;
    this.setState({
      ...this.state,
      volume: videoElement.volume,
      muted: videoElement.muted,
    });

    this.setupNetworking(shaka);
    this.setupListeners();
  }

  load(source: AudioSource, audiofileId: Audiofile["id"]): Promise<void> {
    const controller = this.beginOperation();
    return this.runOperation(controller, () =>
      this.loadAudiofile(source, audiofileId, controller),
    );
  }

  next(): Promise<void> {
    return this.navigate("next");
  }

  previous(): Promise<void> {
    return this.navigate("prev");
  }

  unload() {
    this.activeLoad?.abort();
    this.activeLoad = undefined;
    this.authorization = undefined;
    this.releaseSource();
    this.setUnloaded();
    this.videoElement?.pause();
    if (this.player) void this.player.unload();
  }

  async destroy() {
    this.activeLoad?.abort();
    this.activeLoad = undefined;
    this.authorization = undefined;
    this.releaseSource();
    this.setUnloaded();

    if (this.player) {
      await this.player.destroy();
      this.player = undefined;
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
      this.setState({ ...this.state, position });
    }
  }

  private setState(nextState: PlaybackState) {
    if (playbackStatesEqual(this.state, nextState)) return;
    this.state = nextState;
    this.stateListeners.forEach((listener) => listener());
  }

  private setUnloaded() {
    this.setState(toUnloadedPlaybackState(this.state));
  }

  private beginOperation() {
    // Aborting is only half of cancellation: the signal is also checked after
    // platform promises that Shaka cannot cancel itself.
    this.activeLoad?.abort();
    const controller = new AbortController();
    this.activeLoad = controller;
    return controller;
  }

  private async runOperation(
    controller: AbortController,
    operation: () => Promise<void>,
  ) {
    try {
      await operation();
    } catch (error) {
      if (controller.signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      if (this.activeLoad === controller) {
        this.authorization = undefined;
        this.releaseSource();
        this.setUnloaded();
        this.videoElement?.pause();
        await this.player?.unload().catch(() => {});
      }
      throw error;
    } finally {
      if (this.activeLoad === controller) this.activeLoad = undefined;
    }
  }

  private releaseSource() {
    this.sourceUnsubscribe?.();
    this.sourceUnsubscribe = undefined;
  }

  private setActiveSource(source: AudioSource) {
    const currentSource = this.state.currentMedia?.source;
    if (source === currentSource && this.sourceUnsubscribe) return;
    this.releaseSource();
    this.sourceUnsubscribe = source.subscribe(() => this.handleSourceChange());
  }

  private handleSourceChange() {
    const state = this.state;
    const media = state.currentMedia;
    if (!media) return;

    const list = media.source.getAudiofiles();
    const index = list.findIndex(({ id }) => id === media.audiofile.id);
    // A removed item keeps playing. Its last known index is the stable cursor
    // used to choose a neighbor from the updated source.
    if (index === -1) return;
    const audiofile = list[index];
    if (index === media.index && audiofile === media.audiofile) return;

    this.setState(updateCurrentMediaLocation(state, index, audiofile));
  }

  private async resolveItem(audiofile: Audiofile, signal: AbortSignal) {
    if (!this.mediaPreferences) throw new Error("Player not initialized");
    const [item] = await resolvePlaybackItems(
      audiofile,
      this.mediaPreferences,
      signal,
    );
    signal.throwIfAborted();
    return item;
  }

  private async loadAudiofile(
    source: AudioSource,
    audiofileId: Audiofile["id"],
    controller: AbortController,
  ) {
    if (!this.player || !this.videoElement) {
      throw new Error("Player not initialized");
    }

    const list = source.getAudiofiles();
    const index = list.findIndex((audiofile) => audiofile.id === audiofileId);
    if (index === -1) {
      throw new Error("The selected track is no longer available");
    }

    const selection: CurrentMedia<undefined> = {
      source,
      index,
      audiofile: list[index],
      playbackItem: undefined,
    };
    this.videoElement.pause();
    this.authorization = undefined;
    this.setActiveSource(source);
    this.setState({
      status: "loading",
      currentMedia: selection,
      position: 0,
      duration: 0,
      volume: this.state.volume,
      muted: this.state.muted,
    });

    await this.player.unload();
    controller.signal.throwIfAborted();
    const item = await this.resolveItem(selection.audiofile, controller.signal);
    if (!item) throw new UnsupportedPlaybackError(selection.audiofile.id);

    const { token } = await createEncodingToken({
      path: { encoding_id: item.encoding.id },
      signal: controller.signal,
    });
    controller.signal.throwIfAborted();
    this.authorization = { encodingId: item.encoding.id, token };

    await this.player.load(item.objectId);
    controller.signal.throwIfAborted();
    await this.videoElement.play();
    controller.signal.throwIfAborted();

    const latestSelection = this.state.currentMedia;
    const selectedMedia =
      this.state.status === "loading" &&
      latestSelection?.source === source &&
      latestSelection.audiofile.id === audiofileId
        ? latestSelection
        : selection;
    const media: CurrentMedia = { ...selectedMedia, playbackItem: item };
    this.setState({
      status: "playing",
      currentMedia: media,
      position: this.videoElement.currentTime,
      duration: this.videoElement.duration || 0,
      volume: this.videoElement.volume,
      muted: this.videoElement.muted,
    });
  }

  private async getNavigationTarget(
    source: AudioSource,
    media: CurrentMedia<PlaybackItem | undefined>,
    action: "next" | "prev",
    signal: AbortSignal,
  ) {
    let list = source.getAudiofiles();
    let index = getNextAudioIndex(
      list,
      media.audiofile.id,
      action,
      media.index,
      false,
    );

    while (
      action === "next" &&
      index === undefined &&
      source.pagination?.hasMore()
    ) {
      const previousLength = list.length;
      await source.pagination.loadMore();
      signal.throwIfAborted();
      list = source.getAudiofiles();
      index = getNextAudioIndex(
        list,
        media.audiofile.id,
        action,
        media.index,
        false,
      );
      if (list.length === previousLength) break;
    }

    if (index === undefined && !source.pagination?.hasMore()) {
      index = getNextAudioIndex(list, media.audiofile.id, action, media.index);
    }
    if (index === undefined) return undefined;
    const audiofile = list[index];
    if (!audiofile || audiofile.id === media.audiofile.id) return undefined;
    return { audiofile, index };
  }

  private async navigate(action: "next" | "prev") {
    const media = this.state.currentMedia;
    if (!media) return;
    const source = media.source;
    const controller = this.beginOperation();

    await this.runOperation(controller, async () => {
      if (source.getAudiofiles().length === 0) {
        throw new Error("The playback queue is no longer available");
      }

      const visited = new Set<Audiofile["id"]>([media.audiofile.id]);
      let cursor: CurrentMedia<PlaybackItem | undefined> = media;
      let lastUnsupported: UnsupportedPlaybackError | undefined;

      while (true) {
        const target = await this.getNavigationTarget(
          source,
          cursor,
          action,
          controller.signal,
        );
        if (!target || visited.has(target.audiofile.id)) {
          if (lastUnsupported) throw lastUnsupported;
          return;
        }
        visited.add(target.audiofile.id);

        try {
          await this.loadAudiofile(source, target.audiofile.id, controller);
          return;
        } catch (error) {
          if (!(error instanceof UnsupportedPlaybackError)) throw error;
          lastUnsupported = error;
          cursor = {
            source,
            index: target.index,
            audiofile: target.audiofile,
            playbackItem: undefined,
          };
        }
      }
    });
  }

  private setupNetworking(shakaModule: typeof shaka) {
    const netEngine = this.player?.getNetworkingEngine();
    const player = this.player;
    if (!netEngine || !player) return;

    netEngine.registerRequestFilter((type, request) => {
      if (
        type === shakaModule.net.NetworkingEngine.RequestType.MANIFEST ||
        type === shakaModule.net.NetworkingEngine.RequestType.SEGMENT
      ) {
        const originalUrl = request.uris[0];
        const objectName = originalUrl.slice(originalUrl.lastIndexOf("/") + 1);
        request.uris[0] = `${CDN_URL}/${objectName}`;

        const encodingId = this.getEncodingId(objectName);
        const authorization = this.authorization;
        if (authorization && encodingId === authorization.encodingId) {
          request.headers["Authorization"] = `Bearer ${authorization.token}`;
        }
      }
    });

    player.configure(
      "streaming.failureCallback",
      async (error: shaka.util.Error) => {
        const encodingId = this.getUnauthorizedEncodingId(error);
        const authorization = this.authorization;
        if (!authorization || encodingId !== authorization.encodingId) return;

        let refresh = authorization.refresh;
        if (!refresh) {
          const pending = createEncodingToken({
            path: { encoding_id: encodingId },
          })
            .then(({ token }) => {
              if (
                this.authorization === authorization &&
                authorization.refresh === pending
              ) {
                authorization.token = token;
                player.retryStreaming();
              }
              return token;
            })
            .catch((refreshError) => {
              if (
                this.authorization === authorization &&
                authorization.refresh === pending
              ) {
                this.failPlayback(refreshError);
              }
              throw refreshError;
            })
            .finally(() => {
              if (
                this.authorization === authorization &&
                authorization.refresh === pending
              ) {
                authorization.refresh = undefined;
              }
            });
          authorization.refresh = pending;
          refresh = pending;
        }

        await refresh.catch(() => {});
      },
    );
  }

  private getEncodingId(urlOrObjectName: string) {
    const path = urlOrObjectName.split(/[?#]/, 1)[0];
    const objectName = path.slice(path.lastIndexOf("/") + 1);
    const separator = objectName.indexOf(".");
    return separator > 0 ? objectName.slice(0, separator) : undefined;
  }

  private getUnauthorizedEncodingId(error: shaka.util.Error | undefined) {
    const [url, status] = error?.data ?? [];
    if (typeof url === "string" && url.startsWith(CDN_URL) && status === 401) {
      return this.getEncodingId(url);
    }
  }

  private failPlayback(error: unknown) {
    console.error("Playback failed after loading completed", error);
    this.unload();
  }

  private setupListeners() {
    if (!this.videoElement || !this.player) return;

    this.videoElement.addEventListener("ended", () => {
      void this.next().catch((error) => {
        if (!(error instanceof Error && error.name === "AbortError")) {
          console.error("Unable to advance playback", error);
        }
      });
    });
    this.videoElement.addEventListener("play", () => {
      if (this.state.status !== "paused") return;
      this.setState({ ...this.state, status: "playing" });
    });
    this.videoElement.addEventListener("pause", () => {
      if (this.state.status !== "playing") return;
      this.setState({ ...this.state, status: "paused" });
    });
    this.videoElement.addEventListener("volumechange", () => {
      if (!this.videoElement) return;
      this.setState({
        ...this.state,
        volume: this.videoElement.volume,
        muted: this.videoElement.muted,
      });
    });
    this.videoElement.addEventListener("timeupdate", () => {
      if (
        !this.videoElement ||
        (this.state.status !== "playing" && this.state.status !== "paused")
      ) {
        return;
      }
      this.setState({
        ...this.state,
        position: this.videoElement.currentTime,
        duration: this.videoElement.duration || 0,
      });
    });
    this.player.addEventListener("error", (event) => {
      const error = (event as Event & { detail: shaka.util.Error }).detail;
      // Shaka emits this event and rejects load() for the same manifest error.
      // The active load owns that failure and resets state through runOperation.
      if (
        this.state.status !== "loading" &&
        !this.getUnauthorizedEncodingId(error)
      ) {
        this.failPlayback(error);
      }
    });
  }
}
