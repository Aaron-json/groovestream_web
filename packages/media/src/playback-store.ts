import type { Audiofile } from "@groovestream/api/models";
import { create } from "zustand";
import {
  INITIAL_PLAYBACK_STATE,
  type CurrentMedia,
  type MediaPlayer,
  type PlaybackState,
} from "./player";
import type { AudioSource } from "./source";

export type PlaybackEffects = {
  onMediaChange?: (
    media: CurrentMedia,
    previous: CurrentMedia | undefined,
  ) => void;
};

export type PlaybackStore = {
  player: MediaPlayer | undefined;
  playerState: PlaybackState;

  /** Derived snapshots for rendering; AudioSource remains authoritative. */
  sourceAudiofiles: readonly Audiofile[];
  sourceHasMore: boolean;
  sourceLoadingMore: boolean;

  init(player: MediaPlayer, effects?: PlaybackEffects): Promise<void>;
  destroy(): Promise<void>;
  setMedia(source: AudioSource, index?: number): Promise<void>;
  selectMedia(audiofileId: Audiofile["id"]): Promise<void>;
  unloadMedia(): void;
  play(): Promise<void>;
  pause(): void;
  playPauseToggle(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  setVolume(volume: number): void;
  setMute(mute: boolean): void;
  seek(position: number): Promise<void>;
  loadMore(): Promise<void>;
};

const initialStoreState = {
  player: undefined,
  playerState: INITIAL_PLAYBACK_STATE,
  sourceAudiofiles: [] as readonly Audiofile[],
  sourceHasMore: false,
  sourceLoadingMore: false,
};

let initializingPlayer: MediaPlayer | undefined;
let initialization: Promise<void> | undefined;
let playerStateUnsubscribe: (() => void) | undefined;
let playbackEffects: PlaybackEffects = {};
let lastStartedMedia: CurrentMedia | undefined;
let subscribedSource: AudioSource | undefined;
let sourceUnsubscribe: (() => void) | undefined;

export function isPlaybackAbort(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export const usePlaybackStore = create<PlaybackStore>((set, get) => {
  function syncSourceSnapshot(source: AudioSource | undefined) {
    if (!source) {
      set({
        sourceAudiofiles: [],
        sourceHasMore: false,
        sourceLoadingMore: false,
      });
      return;
    }
    set({
      sourceAudiofiles: source.getAudiofiles(),
      sourceHasMore: source.pagination?.hasMore() ?? false,
      sourceLoadingMore: source.pagination?.isLoading() ?? false,
    });
  }

  function setSource(source: AudioSource | undefined) {
    if (source === subscribedSource) {
      syncSourceSnapshot(source);
      return;
    }
    sourceUnsubscribe?.();
    sourceUnsubscribe = undefined;
    subscribedSource = source;
    syncSourceSnapshot(source);
    if (source) {
      sourceUnsubscribe = source.subscribe(() => syncSourceSnapshot(source));
    }
  }

  function releaseSource() {
    sourceUnsubscribe?.();
    sourceUnsubscribe = undefined;
    subscribedSource = undefined;
    syncSourceSnapshot(undefined);
  }

  function syncPlayerState(player: MediaPlayer) {
    if (player !== get().player && player !== initializingPlayer) return;

    const previousState = get().playerState;
    const nextState = player.getState();
    if (nextState === previousState) return;

    const previousMedia = previousState.currentMedia;
    const media = nextState.currentMedia;
    if (media?.source !== previousMedia?.source) {
      if (media) setSource(media.source);
      else releaseSource();
    }
    set({ playerState: nextState });

    if (nextState.status !== "playing") return;
    const playingMedia = nextState.currentMedia;
    const previous = lastStartedMedia;
    if (
      playingMedia.source === previous?.source &&
      playingMedia.audiofile.id === previous.audiofile.id
    ) {
      return;
    }
    lastStartedMedia = playingMedia;
    playbackEffects.onMediaChange?.(playingMedia, previous);
  }

  async function runCommand(command: () => Promise<void>) {
    try {
      await command();
    } catch (error) {
      if (!isPlaybackAbort(error)) throw error;
    }
  }

  return {
    ...initialStoreState,

    init: async (player, effects = {}) => {
      const activePlayer = get().player;
      if (activePlayer === player) {
        playbackEffects = effects;
        return;
      }
      if (activePlayer) {
        await player.destroy();
        return;
      }
      if (initialization) {
        if (initializingPlayer === player) {
          playbackEffects = effects;
          return initialization;
        }
        await player.destroy();
        return initialization;
      }

      initializingPlayer = player;
      playbackEffects = effects;
      lastStartedMedia = undefined;
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
      playbackEffects = {};
      lastStartedMedia = undefined;
      const unsubscribe = playerStateUnsubscribe;
      playerStateUnsubscribe = undefined;
      unsubscribe?.();
      releaseSource();
      set(initialStoreState);
      if (pending) await pending.catch(() => {});
      // A provider may remount while initialization is settling. Its new
      // ownership must win over cleanup from the previous effect instance.
      if (get().player === player || initializingPlayer === player) return;
      await player?.destroy();
    },

    setMedia: async (source, index = 0) => {
      const audiofile = source.getAudiofiles()[index];
      const { player, playerState } = get();
      if (!player) throw new Error("Media player is not initialized");
      if (!audiofile) {
        throw new Error("The selected track is no longer available");
      }
      const current = playerState.currentMedia;
      if (
        playerState.status !== "loading" &&
        source === current?.source &&
        audiofile.id === current.audiofile.id
      ) {
        await player.seek(0);
        await player.play();
        return;
      }
      await runCommand(() => player.load(source, audiofile.id));
    },

    selectMedia: async (audiofileId) => {
      const source = get().playerState.currentMedia?.source;
      if (!source) throw new Error("There is no active playback source");
      const index = source
        .getAudiofiles()
        .findIndex((audiofile) => audiofile.id === audiofileId);
      if (index === -1) {
        throw new Error("The selected track is no longer available");
      }
      await get().setMedia(source, index);
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
    next: () => runCommand(async () => get().player?.next()),
    previous: () => runCommand(async () => get().player?.previous()),
    setVolume: (volume) => get().player?.setVolume(volume),
    setMute: (mute) => get().player?.setMute(mute),
    seek: async (position) => {
      await get().player?.seek(position);
    },
    loadMore: async () => {
      const source = get().playerState.currentMedia?.source;
      const pagination = source?.pagination;
      if (!pagination || !pagination.hasMore() || pagination.isLoading()) return;
      await pagination.loadMore();
      syncSourceSnapshot(source);
    },
  };
});
