import type { Audiofile } from "@groovestream/api/models";
import { shallow } from "zustand/shallow";
import type { PlaybackItem } from "./encodings";
import type { AudioSourcePosition } from "./source";

export const PREVIOUS_RESTART_THRESHOLD_SECONDS = 3;

export type CurrentMedia<
  TPlaybackItem extends PlaybackItem | undefined = PlaybackItem,
> = AudioSourcePosition &
  Readonly<{
    playbackItem: TPlaybackItem;
  }>;

type PlayerIntrinsics = Readonly<{
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

/** Replaces the live source position without changing its hydration level. */
export function updateCurrentSourcePosition(
  state: PlaybackState,
  position: AudioSourcePosition,
): PlaybackState {
  if (state.status === "unloaded") return state;
  if (
    state.currentMedia.source === position.source &&
    state.currentMedia.index === position.index &&
    state.currentMedia.audiofile === position.audiofile
  ) {
    return state;
  }

  // Object.assign retains the correlation between the discriminated status
  // and its hydrated or unhydrated media while replacing the nested position.
  const currentMedia = Object.assign({}, state.currentMedia, position);
  return Object.assign({}, state, { currentMedia });
}

export class UnsupportedPlaybackError extends Error {
  override name = "UnsupportedPlaybackError";

  constructor(audiofileId: Audiofile["id"]) {
    super(`Audio file ${audiofileId} has no supported playback representation`);
  }
}

export interface MediaPlayer {
  init(): Promise<void>;
  /** Returns a stable snapshot until the player state changes. */
  getState(): PlaybackState;
  /** Registers an invalidation listener; read the new snapshot with `getState`. */
  subscribeToState(listener: () => void): () => void;
  /**
   * Loads or restarts a caller snapshot. The player owns reconciling it with
   * the live source before use and maintaining the active position afterward.
   */
  load(position: AudioSourcePosition): Promise<void>;
  next(): Promise<void>;
  /** Restarts progressed media; otherwise loads the previous source position. */
  previous(): Promise<void>;
  unload(): void;
  destroy(): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  setVolume(volume: number): void;
  setMute(mute: boolean): void;
  seek(time: number): Promise<void>;
}
