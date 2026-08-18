import type { Audiofile } from "@groovestream/api/models";
import { shallow } from "zustand/shallow";
import type { PlaybackItem } from "./encodings";
import type { AudioSource } from "./source";

export type CurrentMedia<
  TPlaybackItem extends PlaybackItem | undefined = PlaybackItem,
> = Readonly<{
  source: AudioSource;
  index: number;
  audiofile: Audiofile;
  playbackItem: TPlaybackItem;
}>;

export type PlayerIntrinsics = Readonly<{
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
}>;

type PlaybackPhase =
  | Readonly<{
      status: "unloaded";
      currentMedia: undefined;
    }>
  | Readonly<{
      status: "loading";
      currentMedia: CurrentMedia<undefined>;
    }>
  | Readonly<{
      status: "playing" | "paused";
      currentMedia: CurrentMedia;
    }>;

/**
 * A complete player snapshot. Narrowing `status` also narrows which media
 * metadata is available, so selection and representation state cannot drift.
 */
export type PlaybackState = PlayerIntrinsics & PlaybackPhase;

export const INITIAL_PLAYBACK_STATE: PlaybackState = {
  status: "unloaded",
  currentMedia: undefined,
  position: 0,
  duration: 0,
  volume: 0,
  muted: false,
};

export function playbackStatesEqual(
  left: PlaybackState,
  right: PlaybackState,
): boolean {
  return shallow(left, right);
}

/**
 * Builds the unloaded phase from the full intrinsic snapshot. The timeline is
 * reset because it belongs to the removed media; future control fields survive
 * through the spread without requiring another transition checklist.
 */
export function toUnloadedPlaybackState(
  state: PlayerIntrinsics,
): PlaybackState {
  return {
    ...state,
    status: "unloaded",
    currentMedia: undefined,
    position: 0,
    duration: 0,
  };
}

/** Updates live source metadata without changing the phase's hydration level. */
export function updateCurrentMediaLocation(
  state: PlaybackState,
  index: number,
  audiofile: Audiofile,
): PlaybackState {
  if (state.status === "unloaded") return state;
  if (state.status === "loading") {
    return {
      ...state,
      currentMedia: { ...state.currentMedia, index, audiofile },
    };
  }
  return {
    ...state,
    currentMedia: { ...state.currentMedia, index, audiofile },
  };
}

export class UnsupportedPlaybackError extends Error {
  override name = "UnsupportedPlaybackError";

  constructor(audiofileId: Audiofile["id"]) {
    super(`Audio file ${audiofileId} has no supported playback representation`);
  }
}

export interface MediaPlayer {
  isSupported(): boolean;
  init(): Promise<void>;
  getState(): PlaybackState;
  /** Registers an invalidation listener; read the new snapshot with `getState`. */
  subscribeToState(listener: () => void): () => void;
  load(source: AudioSource, audiofileId: Audiofile["id"]): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  unload(): void;
  destroy(): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  setVolume(volume: number): void;
  setMute(mute: boolean): void;
  seek(time: number): Promise<void>;
}
