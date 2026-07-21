import { CDN_URL } from "@/api/api";
import { MediaPlayer, PlayerCallbacks } from "../types";

const DEFAULT_VOLUME = 0.7;

export default class WebAudioPlayer implements MediaPlayer {
  private videoElement: HTMLVideoElement | null = null;
  private player: shaka.Player | undefined;
  private shakaModule: typeof shaka | undefined;
  private authToken: string | undefined;
  // acts as a lock for multiple requests all trying to
  // refresh the token since shaka can do concurrent requests
  private tokenRefreshPromise: Promise<string> | undefined;
  private callbacks: PlayerCallbacks = {};

  constructor() {
    // Only access document if in browser environment
    if (typeof document !== "undefined") {
      this.videoElement = document.createElement("video");
      this.videoElement.playsInline = true;
      this.videoElement.style.display = "none";
      this.videoElement.style.width = "0";
      this.videoElement.style.height = "0";
      this.videoElement.style.visibility = "hidden";
      this.videoElement.volume = DEFAULT_VOLUME;
      document.body.appendChild(this.videoElement);
    }
  }

  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    // We do not use shaka for this check to avoid loading the massive
    // bundle on app startup
    return !!window.MediaSource || "WebKitMediaSource" in window;
  }

  setCallbacks(cb: PlayerCallbacks): void {
    Object.assign(this.callbacks, cb);
  }

  async init(callbacks: PlayerCallbacks | undefined): Promise<void> {
    if (!this.videoElement) return;
    if (this.player) {
      throw new Error("Player already initialized");
    }

    // Lazily load the headless compiled version of Shaka
    const module = await import("shaka-player/dist/shaka-player.compiled.js");
    this.shakaModule = module.default || module;
    const shaka = this.shakaModule!;

    shaka.polyfill.installAll();
    this.player = new shaka.Player();
    await this.player.attach(this.videoElement);
    if (callbacks) this.setCallbacks(callbacks);

    this.setupNetworking();
    this.setupListeners();

    this.player.configure({
      streaming: {
        lowLatencyMode: true,
        rebufferingGoal: 0.01,
        bufferingGoal: 10,
        bufferBehind: 30,
      },
    });
  }

  setToken(token: string) {
    this.authToken = token;
  }

  async load(manifestUrl: string): Promise<number> {
    if (!this.player || !this.videoElement)
      throw new Error("Player not initialized");

    await this.player.load(manifestUrl);
    return this.videoElement.duration;
  }

  async unload() {
    if (this.player) {
      this.player.unload();
    }
    this.authToken = undefined;
  }

  async destroy() {
    if (this.player) {
      await this.player.destroy();
      this.player = undefined;
    }

    if (this.videoElement) {
      this.videoElement.remove();
      this.videoElement = null;
    }

    this.callbacks = {};
    this.authToken = undefined;
  }

  async play() {
    return this.videoElement?.play();
  }

  pause() {
    this.videoElement?.pause();
  }

  setVolume(vol: number) {
    if (this.videoElement) this.videoElement.volume = vol;
  }

  getVolume() {
    return this.videoElement?.volume || 0;
  }

  setMute(mute: boolean) {
    if (this.videoElement) this.videoElement.muted = mute;
  }

  seek(time: number) {
    if (this.videoElement) this.videoElement.currentTime = time;
  }

  getPosition() {
    return this.videoElement?.currentTime || 0;
  }

  private setupNetworking() {
    const netEngine = this.player?.getNetworkingEngine();
    const player = this.player;
    if (!netEngine || !player) return;

    const shaka = this.shakaModule;
    if (!shaka) throw new Error("Shaka module not loaded");

    netEngine.registerRequestFilter(async (type, request) => {
      if (
        type === shaka.net.NetworkingEngine.RequestType.MANIFEST ||
        type === shaka.net.NetworkingEngine.RequestType.SEGMENT
      ) {
        const original_url = request.uris[0];
        const object_name = original_url.slice(
          original_url.lastIndexOf("/") + 1,
        );
        const cdn_url = `${CDN_URL}/${object_name}`;
        request.uris[0] = cdn_url;

        if (this.authToken) {
          request.headers["Authorization"] = `Bearer ${this.authToken}`;
        }
      }
    });

    player.configure(
      "streaming.failureCallback",
      async (error: shaka.util.Error) => {
        const data = error.data;
        if (
          !Array.isArray(data) ||
          typeof data[0] !== "string" ||
          typeof data[1] !== "number"
        ) {
          return;
        }
        console.log("failureCallback", data);
        const url = data[0];
        const code = data[1];
        if (
          url.startsWith(CDN_URL) &&
          code === 401 &&
          this.callbacks.refreshToken &&
          !this.tokenRefreshPromise
        ) {
          this.tokenRefreshPromise = this.callbacks
            .refreshToken()
            .then((token) => {
              if (!token) {
                throw new Error("Token refresh callback not provided");
              }
              this.authToken = token;
              player.retryStreaming();
              return token;
            })
            .finally(() => (this.tokenRefreshPromise = undefined));
        }

        // let the network engine handle the error as normal
        await this.tokenRefreshPromise?.catch(() => {});
      },
    );
  }

  // this function is called during initialization and sets up references to
  // mutable callbacks. This removes the need to delete/cleanup listeners.
  private setupListeners() {
    if (!this.videoElement || !this.player) return;

    this.videoElement.addEventListener("ended", () => {
      this.callbacks.onEnded?.();
    });
    this.videoElement.addEventListener("play", () => {
      this.callbacks.onPlay?.();
    });
    this.videoElement.addEventListener("pause", () => {
      this.callbacks.onPause?.();
    });
    this.videoElement.addEventListener("volumechange", (e) => {
      const target = e.target as HTMLVideoElement;
      this.callbacks.onVolumeChange?.(target.volume, target.muted);
    });
    this.player.addEventListener("error", (e) => {
      this.callbacks.onError?.(e);
    });
  }
}
