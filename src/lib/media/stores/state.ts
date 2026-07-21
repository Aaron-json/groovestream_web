import { create } from "zustand";
import { toast } from "sonner";
import { resolveEncoding, trackHistory } from "../api";
import { getNextAudioIndex } from "../utils";
import {
  AudiofileSource,
  CurrentMedia,
  MediaPlayer,
  PlaybackState,
  PlayerCallbacks,
} from "../types";
import { getEncodingToken } from "@/api/requests/media";

export type MediaSlice = {
  media: CurrentMedia | undefined;
  player: MediaPlayer | undefined;
  _playerFactory: (() => MediaPlayer) | undefined;
  playbackState: PlaybackState;
  volume: number;
  mute: boolean;

  // actions
  init: (player: () => MediaPlayer) => Promise<void>;
  setMedia: (source: AudiofileSource, index?: number) => Promise<void>;
  unloadMedia: () => void;
  play: () => Promise<void>;
  pause: () => void;
  playPauseToggle: () => void;

  // controls
  next: () => void;
  prev: () => void;
  setVolume: (volume: number) => void;
  setMute: (mute: boolean) => void;
  getSeek: () => number;
  setSeek: (position: number) => void;

  // internal setters
  _setPlaybackState: (state: PlaybackState) => void;
  _setMediaState: (media: CurrentMedia | undefined) => void;
  _setVolumeState: (volume: number) => void;
  _setMuteState: (mute: boolean) => void;
  _handleNextPrev: (action: "next" | "prev") => void;
};

export const useMediaStateStore = create<MediaSlice>((set, get) => ({
  media: undefined,
  player: undefined,
  // allows the media controller store to own the player instance.
  // player can be recreated when needed. (ex. irrecoverable error)
  _playerFactory: undefined,
  playbackState: "unloaded",
  mute: false,
  // default volume is set from the player during initialization
  volume: 0,

  init: async (factory: () => MediaPlayer) => {
    const player = factory();
    const callbacks: PlayerCallbacks = {
      onEnded: () => get().next(),
      onPlay: () => get()._setPlaybackState("playing"),
      onPause: () => get()._setPlaybackState("paused"),
      onVolumeChange: (vol, muted) => {
        get()._setVolumeState(vol);
        get()._setMuteState(muted);
      },
    };
    await player.init(callbacks);
    set({ player, _playerFactory: factory, volume: player.getVolume() });
  },

  setMedia: async (source, index = 0) => {
    const currentMedia = get().media;
    const list = source.getAudiofiles();
    const audiofile = list?.[index];
    const player = get().player;

    if (!player) {
      throw new Error("Media player is not initialized");
    }
    if (!audiofile) {
      throw new Error("The selected track is no longer available");
    }

    // if same song, replay
    if (
      source === currentMedia?.source &&
      audiofile.id === currentMedia?.audiofile.id
    ) {
      player.seek(0);
      return player.play();
    }

    const { _setPlaybackState, _setMediaState, unloadMedia } = get();
    if (get().playbackState === "loading") return;

    _setPlaybackState("loading");

    try {
      const { encoding, token, manifestUrl } = await resolveEncoding(
        audiofile.id,
      );

      // set the token and callback when it expires
      player.setToken(token);
      player.setCallbacks({
        refreshToken: async () => {
          const token = await getEncodingToken({
            encoding_id: encoding.id,
          });
          return token.token;
        },
      });
      await player.load(manifestUrl);

      _setMediaState({ index, audiofile, source });
      await player.play();

      trackHistory(audiofile.id);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;

      console.error(error);
      unloadMedia();
      throw error;
    }
  },

  unloadMedia: () => {
    const { player, _setMediaState, _setPlaybackState } = get();
    if (player) {
      player.unload();
    }
    _setPlaybackState("unloaded");
    _setMediaState(undefined);
  },

  play: async () => {
    const { player, playbackState, unloadMedia } = get();
    if (!player) {
      return;
    }

    if (playbackState === "paused") {
      try {
        await player.play();
      } catch {
        unloadMedia();
      }
    }
  },

  pause: () => {
    const player = get().player;
    if (!player) {
      return;
    }
    if (get().playbackState === "playing") player.pause();
  },

  playPauseToggle: () => {
    const { playbackState } = get();
    if (playbackState === "playing") get().pause();
    else if (playbackState === "paused") get().play();
  },
  next: () => get()._handleNextPrev("next"),
  prev: () => get()._handleNextPrev("prev"),

  setVolume: (v) => {
    const player = get().player;
    if (!player) {
      return;
    }
    player.setVolume(v);
  },
  setMute: (m) => {
    const player = get().player;
    if (!player) {
      return;
    }
    player.setMute(m);
  },
  setSeek: (t) => {
    const player = get().player;
    if (!player) {
      return;
    }
    player.seek(t);
  },
  getSeek: () => {
    const player = get().player;
    if (!player) {
      return 0;
    }
    return player.getPosition();
  },

  _setPlaybackState: (s) => set({ playbackState: s }),
  _setMediaState: (m) => set({ media: m }),
  _setVolumeState: (v) => set({ volume: v }),
  _setMuteState: (m) => set({ mute: m }),
  _handleNextPrev: (action: "next" | "prev") => {
    const { media, unloadMedia, setMedia } = get();

    if (!media) {
      unloadMedia();
      return;
    }

    const list = media.source.getAudiofiles();
    if (list.length === 0) {
      unloadMedia();
      toast.error("The playback queue is no longer available");
      return;
    }

    const nextIndex = getNextAudioIndex(
      list,
      media.audiofile.id,
      action,
      media.index,
    );

    setMedia(media.source, nextIndex).catch(() => {
      unloadMedia();
      toast.error("Error changing track");
    });
  },
}));
