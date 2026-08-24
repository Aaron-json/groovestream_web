import { CDN_URL } from "@/api/api";
import type { Audiofile } from "@groovestream/api/models";
import { createEncodingToken } from "@groovestream/api/sdk";
import {
  resolvePlaybackItems,
  type MediaPreferences,
  type PlaybackItem,
} from "@groovestream/media/encodings";
import {
  getAdjacentAudioSourcePosition,
  reconcileAudioSourcePosition,
  type AudioSource,
  type AudioSourcePosition,
} from "@groovestream/media/source";
import {
  INITIAL_PLAYBACK_STATE,
  PREVIOUS_RESTART_THRESHOLD_SECONDS,
  UnsupportedPlaybackError,
  playbackStatesEqual,
  toUnloadedPlaybackState,
  updateCurrentSourcePosition,
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

type SourceSubscription = {
  source: AudioSource;
  unsubscribe: () => void;
};

/**
 * Owns the active AudioSourcePosition. External positions are validated at
 * load boundaries; source notifications keep retained player state current.
 */
export default class WebAudioPlayer implements MediaPlayer {
  private videoElement: HTMLVideoElement | null = null;
  private shakaPlayer: shaka.Player | undefined;
  private cdnAuthorization: CdnAuthorization | undefined;
  private readonly stateListeners = new Set<() => void>();
  private state: PlaybackState = {
    ...INITIAL_PLAYBACK_STATE,
    volume: INITIAL_VOLUME,
  };
  private sourceSubscription: SourceSubscription | undefined;
  private activeOperationController: AbortController | undefined;
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

  load(position: AudioSourcePosition): Promise<void> {
    const selectedPosition = reconcileAudioSourcePosition(position);
    if (!selectedPosition) {
      return Promise.reject(
        new Error("The selected track is no longer available"),
      );
    }

    return this.runLatestPlaybackOperation(async (signal) => {
      const currentMedia = this.state.currentMedia;
      if (
        this.state.status !== "loading" &&
        selectedPosition.source === currentMedia?.source &&
        selectedPosition.audiofile.id === currentMedia.audiofile.id
      ) {
        await this.seek(0);
        signal.throwIfAborted();
        await this.play();
        signal.throwIfAborted();
        return;
      }

      try {
        await this.beginLoading(selectedPosition, signal);
        const playbackItem = await this.resolvePlaybackItem(
          selectedPosition,
          signal,
        );
        if (!playbackItem) {
          throw new UnsupportedPlaybackError(selectedPosition.audiofile.id);
        }
        await this.loadPlaybackItem(selectedPosition, playbackItem, signal);
      } catch (error) {
        if (!signal.aborted) await this.clearCurrentMedia();
        throw error;
      }
    });
  }

  next(): Promise<void> {
    return this.navigate("next");
  }

  previous(): Promise<void> {
    const status = this.state.status;
    if (
      (status === "playing" || status === "paused") &&
      this.videoElement &&
      this.videoElement.currentTime > PREVIOUS_RESTART_THRESHOLD_SECONDS
    ) {
      return this.seek(0);
    }
    return this.navigate("previous");
  }

  unload() {
    this.cancelActiveOperation();
    this.clearPlayback();
    void this.shakaPlayer?.unload().catch((error) => {
      console.error("Unable to unload media", error);
    });
  }

  async destroy() {
    this.cancelActiveOperation();
    this.clearPlayback();

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

  private requirePlaybackEngine() {
    const shakaPlayer = this.shakaPlayer;
    const videoElement = this.videoElement;
    const mediaPreferences = this.mediaPreferences;
    if (!shakaPlayer || !videoElement || !mediaPreferences) {
      throw new Error("Player not initialized");
    }
    return { shakaPlayer, videoElement, mediaPreferences };
  }

  private cancelActiveOperation() {
    this.activeOperationController?.abort();
    this.activeOperationController = undefined;
  }

  private clearPlayback() {
    this.cdnAuthorization = undefined;
    this.clearSourceSubscription();
    this.setPlaybackState(toUnloadedPlaybackState(this.state));
    this.videoElement?.pause();
  }

  private async clearCurrentMedia() {
    this.clearPlayback();
    // Cleanup must not replace the playback error reported to the caller.
    await this.shakaPlayer?.unload().catch(() => {});
  }

  private async runLatestPlaybackOperation(
    operation: (signal: AbortSignal) => Promise<void>,
  ) {
    this.cancelActiveOperation();
    const controller = new AbortController();
    this.activeOperationController = controller;

    try {
      await operation(controller.signal);
    } catch (error) {
      if (controller.signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      throw error;
    } finally {
      if (this.activeOperationController === controller) {
        this.activeOperationController = undefined;
      }
    }
  }

  private clearSourceSubscription() {
    const subscription = this.sourceSubscription;
    this.sourceSubscription = undefined;
    subscription?.unsubscribe();
  }

  private subscribeToSource(source: AudioSource) {
    if (this.sourceSubscription?.source === source) return;
    this.clearSourceSubscription();
    const unsubscribe = source.subscribe(() => this.handleSourceUpdate());

    // A source may notify synchronously while being subscribed. If that
    // notification unloaded or replaced the media, do not retain its listener.
    if (this.state.currentMedia?.source !== source) {
      unsubscribe();
      return;
    }
    this.sourceSubscription = { source, unsubscribe };
  }

  private handleSourceUpdate() {
    const state = this.state;
    if (state.status === "unloaded") return;

    // Source notifications are the sole reconciliation point for retained
    // currentMedia. Commands can therefore consume player state without repair.
    const position = reconcileAudioSourcePosition(state.currentMedia);
    if (!position) {
      this.unload();
      return;
    }
    this.setPlaybackState(updateCurrentSourcePosition(state, position));
  }

  private requireCurrentPosition(
    expectedPosition: AudioSourcePosition,
  ): AudioSourcePosition {
    const currentMedia = this.state.currentMedia;
    if (
      !currentMedia ||
      currentMedia.source !== expectedPosition.source ||
      currentMedia.audiofile.id !== expectedPosition.audiofile.id
    ) {
      throw new Error("The current track is no longer in the playback source");
    }
    return currentMedia;
  }

  private setLoadingMedia(position: AudioSourcePosition) {
    const { videoElement } = this.requirePlaybackEngine();
    const currentMedia: CurrentMedia<undefined> = {
      ...position,
      playbackItem: undefined,
    };

    videoElement.pause();
    this.cdnAuthorization = undefined;
    this.setPlaybackState({
      ...this.state,
      status: "loading",
      currentMedia,
      position: 0,
      duration: 0,
    });
    this.subscribeToSource(position.source);
  }

  private async beginLoading(
    position: AudioSourcePosition,
    signal: AbortSignal,
  ) {
    const { shakaPlayer } = this.requirePlaybackEngine();
    signal.throwIfAborted();
    this.setLoadingMedia(position);
    await shakaPlayer.unload();
    signal.throwIfAborted();
  }

  private async resolvePlaybackItem(
    position: AudioSourcePosition,
    signal: AbortSignal,
  ) {
    const { mediaPreferences } = this.requirePlaybackEngine();
    const [playbackItem] = await resolvePlaybackItems(
      position.audiofile,
      mediaPreferences,
      signal,
    );
    return playbackItem;
  }

  private async loadPlaybackItem(
    position: AudioSourcePosition,
    playbackItem: PlaybackItem,
    signal: AbortSignal,
  ) {
    const { shakaPlayer, videoElement } = this.requirePlaybackEngine();
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
    const state = this.state;
    if (
      state.status !== "loading" ||
      state.currentMedia.source !== position.source ||
      state.currentMedia.audiofile.id !== position.audiofile.id
    ) {
      throw new Error("The selected track is no longer available");
    }
    const currentMedia: CurrentMedia = {
      ...state.currentMedia,
      playbackItem,
    };
    this.setPlaybackState({
      ...state,
      status: "paused",
      currentMedia,
      position: videoElement.currentTime,
      duration: videoElement.duration || 0,
      volume: videoElement.volume,
      muted: videoElement.muted,
    });

    try {
      await videoElement.play();
    } catch (error) {
      signal.throwIfAborted();
      // Autoplay policy does not invalidate a successfully loaded encoding.
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        return;
      }
      throw error;
    }
    signal.throwIfAborted();
  }

  /**
   * Finds an adjacent position and fetches one forward page when required.
   * Source notifications maintain the active index; after pagination this
   * method re-reads that player-owned position instead of repairing it itself.
   */
  private async findNavigationTarget(
    cursor: AudioSourcePosition,
    direction: "next" | "previous",
    signal: AbortSignal,
  ) {
    const source = cursor.source;
    let currentPosition = this.requireCurrentPosition(cursor);

    let target = getAdjacentAudioSourcePosition(
      currentPosition,
      direction,
      false,
    );

    if (
      direction === "next" &&
      target === undefined &&
      source.pagination?.hasMore()
    ) {
      await source.pagination.loadMore();
      signal.throwIfAborted();
      currentPosition = this.requireCurrentPosition(cursor);
      target = getAdjacentAudioSourcePosition(
        currentPosition,
        direction,
        false,
      );
    }

    if (target) return target;
    if (source.pagination?.hasMore()) return undefined;

    target = getAdjacentAudioSourcePosition(currentPosition, direction);
    if (!target || target.audiofile.id === currentPosition.audiofile.id) {
      return undefined;
    }
    return target;
  }

  /**
   * Skips only tracks that deterministically lack a supported representation.
   * Network, token, Shaka, and decoding failures escape immediately.
   */
  private async loadFirstSupportedNavigationTarget(
    originAudiofileId: Audiofile["id"],
    initialTarget: AudioSourcePosition,
    direction: "next" | "previous",
    signal: AbortSignal,
  ) {
    // The source wraps and can change while encodings are fetched; IDs provide
    // a stable termination condition when every encountered track is
    // unsupported.
    const encounteredAudiofileIds = new Set<Audiofile["id"]>([
      originAudiofileId,
    ]);
    let candidate = initialTarget;

    await this.beginLoading(candidate, signal);
    while (true) {
      encounteredAudiofileIds.add(candidate.audiofile.id);
      const playbackItem = await this.resolvePlaybackItem(candidate, signal);
      if (playbackItem) {
        await this.loadPlaybackItem(candidate, playbackItem, signal);
        return;
      }

      const unsupportedAudiofileId = candidate.audiofile.id;
      const nextCandidate = await this.findNavigationTarget(
        candidate,
        direction,
        signal,
      );
      if (
        !nextCandidate ||
        encounteredAudiofileIds.has(nextCandidate.audiofile.id)
      ) {
        throw new UnsupportedPlaybackError(unsupportedAudiofileId);
      }

      candidate = nextCandidate;
      this.setLoadingMedia(candidate);
    }
  }

  private async navigate(direction: "next" | "previous") {
    const currentMedia = this.state.currentMedia;
    if (!currentMedia) return;

    await this.runLatestPlaybackOperation(async (signal) => {
      let navigationTarget: AudioSourcePosition | undefined;
      try {
        navigationTarget = await this.findNavigationTarget(
          currentMedia,
          direction,
          signal,
        );
      } catch (error) {
        // A ready track remains valid when pagination fails before a target is
        // selected. A superseded loading operation has no media to preserve.
        if (!signal.aborted && this.state.status === "loading") {
          await this.clearCurrentMedia();
        }
        throw error;
      }

      if (!navigationTarget) {
        if (this.state.status === "loading") await this.clearCurrentMedia();
        return;
      }

      try {
        await this.loadFirstSupportedNavigationTarget(
          currentMedia.audiofile.id,
          navigationTarget,
          direction,
          signal,
        );
      } catch (error) {
        if (!signal.aborted) await this.clearCurrentMedia();
        throw error;
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

  private isUnauthorizedCdnRequest(error: shaka.util.Error) {
    const [url, status] = error.data;
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
      if (this.state.status === "playing") {
        this.setPlaybackState({
          ...this.state,
          status: "paused",
          position: videoElement.currentTime,
          duration: videoElement.duration || 0,
        });
      }
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
