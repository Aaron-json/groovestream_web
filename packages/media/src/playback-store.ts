import { create } from "zustand";
import {
  INITIAL_PLAYBACK_STATE,
  playbackStatesEqual,
  type MediaPlayer,
  type PlaybackState,
} from "./player";
import type { AudioSourcePosition } from "./source";

type PlaybackStore = {
  player: MediaPlayer | undefined;
  playerState: PlaybackState;

  init(player: MediaPlayer): Promise<void>;
  destroy(): Promise<void>;
  setMedia(position: AudioSourcePosition): Promise<void>;
  unloadMedia(): void;
  play(): Promise<void>;
  pause(): void;
  playPauseToggle(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  setVolume(volume: number): void;
  setMute(mute: boolean): void;
  seek(position: number): Promise<void>;
};

const initialStoreState = {
  player: undefined,
  playerState: INITIAL_PLAYBACK_STATE,
};

let initializingPlayer: MediaPlayer | undefined;
let initialization: Promise<void> | undefined;
let playerStateUnsubscribe: (() => void) | undefined;

export const usePlaybackStore = create<PlaybackStore>((set, get) => {
  function syncPlayerState(player: MediaPlayer) {
    if (player !== get().player && player !== initializingPlayer) return;

    const nextState = player.getState();
    if (!playbackStatesEqual(nextState, get().playerState)) {
      set({ playerState: nextState });
    }
  }

  async function ignoreCancellation(command: () => Promise<void> | undefined) {
    try {
      await command();
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) throw error;
    }
  }

  return {
    ...initialStoreState,

    init: async (player) => {
      const activePlayer = get().player;
      if (activePlayer === player) return;
      if (activePlayer) {
        await player.destroy();
        return;
      }
      if (initialization) {
        if (initializingPlayer === player) return initialization;
        await player.destroy();
        return initialization;
      }

      initializingPlayer = player;
      const unsubscribe = player.subscribeToState(() =>
        syncPlayerState(player),
      );
      playerStateUnsubscribe = unsubscribe;
      const pending = player.init();
      initialization = pending;
      try {
        await pending;
        if (initializingPlayer !== player) return;
        initializingPlayer = undefined;
        set({ player });
        syncPlayerState(player);
      } catch (error) {
        if (initializingPlayer === player) {
          initializingPlayer = undefined;
          if (playerStateUnsubscribe === unsubscribe) {
            playerStateUnsubscribe = undefined;
          }
          unsubscribe();
          await player.destroy().catch(() => {});
        }
        throw error;
      } finally {
        if (initialization === pending) initialization = undefined;
      }
    },

    destroy: async () => {
      const player = get().player ?? initializingPlayer;
      const pending = initialization;
      if (initializingPlayer === player) initializingPlayer = undefined;
      initialization = undefined;
      const unsubscribe = playerStateUnsubscribe;
      playerStateUnsubscribe = undefined;
      unsubscribe?.();
      set(initialStoreState);
      if (pending) await pending.catch(() => {});
      // A provider may remount while initialization is settling. Its new
      // ownership must win over cleanup from the previous effect instance.
      if (get().player === player || initializingPlayer === player) return;
      await player?.destroy();
    },

    setMedia: async (position) => {
      const player = get().player;
      if (!player) throw new Error("Media player is not initialized");
      await ignoreCancellation(() => player.load(position));
    },

    unloadMedia: () => get().player?.unload(),

    play: async () => {
      const { player, playerState } = get();
      if (player && playerState.status === "paused") await player.play();
    },
    pause: () => {
      const { player, playerState } = get();
      if (player && playerState.status === "playing") player.pause();
    },
    playPauseToggle: async () => {
      const status = get().playerState.status;
      if (status === "playing") get().pause();
      else if (status === "paused") await get().play();
    },
    next: () => ignoreCancellation(() => get().player?.next()),
    previous: () => ignoreCancellation(() => get().player?.previous()),
    setVolume: (volume) => get().player?.setVolume(volume),
    setMute: (mute) => get().player?.setMute(mute),
    seek: async (position) => {
      await get().player?.seek(position);
    },
  };
});
