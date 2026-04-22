import { Audiofile } from "@/api/types/media";
import { MediaQueryKey } from "@/hooks/media";

export type PlaybackState = "unloaded" | "playing" | "loading" | "paused";

export type CurrentMedia = {
  index?: number;
  queryKey: MediaQueryKey;
  audiofile: Audiofile;
};

export interface LoadResult {
  duration: number;
}

export type RequestContext = {
  headers: Record<string, string>;
  url: string;
};

// Contract for any player implementation (Web or Mobile)
export interface MediaPlayer {
  isSupported(): boolean;
  init(callbacks: PlayerCallbacks): Promise<void>;
  // updates one or more callbacks. if a callback is not set,
  // the existing callback (if any) will be used.
  setCallbacks(callbacks: PlayerCallbacks): void;
  // set the token for fetching audio asssets
  setToken(token: string): void;
  // loads a manifest for new media
  // TODO: in the future, this should be playlist aware
  // to enable seamless transitions
  load(manifestUrl: string): Promise<number>;
  // unloads the currently loaded media
  unload(): void;
  // the player and all its resources will be destroyed.
  // its use cases are rare but useful for unrecoverable
  // errors where it is better to create a new player
  destroy(): void;
  play(): Promise<void>;
  pause(): void;
  setVolume(volume: number): void;
  getVolume(): number;
  setMute(mute: boolean): void;
  seek(time: number): void;
  getPosition(): number;
}

export type PlayerCallbacks = Partial<{
  onEnded: () => void;
  onPlay: () => void;
  onPause: () => void;
  onVolumeChange: (volume: number, muted: boolean) => void;
  refreshToken: () => Promise<string>;
  onError: (error: any) => void;
}>;
