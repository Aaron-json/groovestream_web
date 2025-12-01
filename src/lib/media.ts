import { Audiofile } from "@/api/types/media";
import { create } from "zustand";
import { MediaQueryKey } from "@/hooks/media";
import {
  addListeningHistory,
  getDeliverables,
  getDeliverableToken,
} from "@/api/requests/media";
import { toast } from "sonner";
import shaka from "shaka-player";
import { CDN_URL } from "@/api/axiosClient";

export type MediaListSlice = {
  mediaLists: Record<string, Audiofile[]>;
  setMediaList: (key: string, list: Audiofile[]) => void;
  removeMediaList: (key: string) => void;
};

export const useMediaListStore = create<MediaListSlice>((set) => ({
  mediaLists: {},
  setMediaList: (key, list) => {
    set((prevState) => ({
      mediaLists: {
        ...prevState.mediaLists,
        [key]: list,
      },
    }));
  },
  removeMediaList: (key) => {
    set((prevState) => ({
      ...prevState,
      [key]: undefined,
    }));
  },
}));

const DEFAULT_VOLUME = 0.7;
const videoElement = document.createElement("video");
videoElement.playsInline = true; // avoids mobile full screen video
videoElement.style.display = "none";
videoElement.style.width = "0";
videoElement.style.height = "0";
videoElement.style.position = "absolute";
videoElement.style.visibility = "hidden";
videoElement.volume = DEFAULT_VOLUME;
document.body.appendChild(videoElement);

let player: shaka.Player | undefined = undefined;
// token for the current playing deliverable
let deliverableToken: string | undefined = undefined;

interface LoadResult {
  duration: number;
}

async function loadManifest(
  audiofile_id: Audiofile["id"],
): Promise<LoadResult> {
  if (!player) {
    throw new Error("Player not initialized");
  }
  let deliverables = await getDeliverables(audiofile_id);

  // prefer dash if exists
  let manifestIdx: number | undefined;
  let manifest: string | undefined;

  manifestIdx = deliverables.findIndex((d) => d.dash_manifest_id);
  manifest = deliverables[manifestIdx].dash_manifest_id;

  if (manifestIdx === -1) {
    // no dash try hls
    manifestIdx = deliverables.findIndex((d) => d.hls_manifest_id);
    manifest = deliverables[manifestIdx].hls_manifest_id;
  }

  if (!manifest || manifestIdx === undefined) {
    throw new Error(
      `No DASH or HLS manifest found for audiofile_id: ${audiofile_id}`,
    );
  }

  // must be called before load to set the token
  const token = await getDeliverableToken(deliverables[manifestIdx].id);
  deliverableToken = token.token;

  await player.load(manifest);
  const duration = videoElement.duration;

  return { duration };
}

function getNextAudio(
  medialist: Audiofile[],
  audiofile: Audiofile,
  action: "next" | "prev",
  curIndex?: number,
): number {
  const pos = medialist.findIndex((val) => val.id === audiofile.id);
  let index: number;
  if (pos === -1) {
    // if song is no longer in the list, use the previous known location of the song in the list.
    // this should not happen since playback is stopped when playlist is deleted or when
    // a song is deleted from the playlist. This is a fallback.
    if (curIndex === undefined) {
      return 0;
    }
    index = curIndex;
  } else {
    // if song is still in the list, use its current location in the list
    index = pos;
  }

  if (action === "next") {
    return (index + 1) % medialist.length;
  } else {
    return (index - 1) % medialist.length;
  }
}

async function playNextPrev(action: "next" | "prev") {
  const {
    media: currentMedia,
    playbackState,
    unloadMedia,
  } = useMediaStore.getState();
  const { mediaLists } = useMediaListStore.getState();
  if (!currentMedia) {
    unloadMedia();
    return;
  }
  const currentMediaList = mediaLists[currentMedia.storeKey];
  if (!currentMediaList) {
    unloadMedia();
    return;
  }
  if (playbackState === "playing") {
    videoElement.pause();
  }
  const nextIndex = getNextAudio(
    currentMediaList,
    currentMedia.audiofile,
    action,
    currentMedia.index,
  );
  if (nextIndex === -1) {
    unloadMedia();
    return;
  }
  const nextAudiofile = currentMediaList[nextIndex];

  if (nextAudiofile.id === currentMedia.audiofile.id) {
    try {
      videoElement.currentTime = 0;
      videoElement.play();
    } catch (error) {
      unloadMedia();
      toast("Error playing next track");
    }
  } else {
    loadMedia({
      ...currentMedia,
      audiofile: nextAudiofile,
      index: nextIndex,
    });
  }
}

async function loadMedia(newMedia: CurrentMedia) {
  const {
    _setPlaybackState,
    _setMediaState: _setMedia,
    unloadMedia,
    playbackState,
  } = useMediaStore.getState();
  if (!newMedia) {
    unloadMedia();
    return;
  }
  if (playbackState === "loading") {
    return;
  }
  _setPlaybackState("loading");

  const audiofile = newMedia.audiofile;

  try {
    const loadRes = await loadManifest(audiofile.id);
    if (audiofile.duration === undefined || audiofile.duration === null) {
      // sometimes the server does not successfully get a value for duration
      newMedia.audiofile.duration = loadRes.duration;
    }
    _setMedia(newMedia);
    await videoElement.play();
  } catch (error: any) {
    if (error.name === "AbortError") {
      // user pauses before playback starts
      _setPlaybackState("paused");
      return;
    }
    unloadMedia();
    throw error;
  }
  try {
    addListeningHistory(audiofile.id);
  } catch (error) {}
}

export type CurrentMedia = {
  index?: number;
  storeKey: string;
  queryKey: MediaQueryKey;
  audiofile: Audiofile;
};

export type PlaybackState = "unloaded" | "playing" | "loading" | "paused";

export type MediaSlice = {
  media: CurrentMedia | undefined;
  // Internal method to set the media state wihout side effects.
  _setMediaState: (media: CurrentMedia | undefined) => void;
  setMedia: (
    storeKey: string,
    queryKey: MediaQueryKey,
    index?: number,
  ) => Promise<void>;
  unloadMedia: () => void;
  playbackState: PlaybackState;
  _setPlaybackState: (state: PlaybackState) => void;
  play: () => Promise<void>;
  pause: () => void;
  playPauseToggle: () => void;
  mute: boolean;
  _setMuteState: (mute: boolean) => void;
  setMute: (mute: boolean) => void;
  volume: number;
  _setVolumeState: (volume: number) => void;
  setVolume: (volume: number) => void;
  getSeek: () => number;
  setSeek: (position: number) => void;
  next: () => void;
  prev: () => void;
};

export const useMediaStore = create<MediaSlice>((set, get) => {
  return {
    media: undefined,
    _setMediaState: (media) => {
      set(() => ({
        media,
      }));
    },
    setMedia: async (
      storeKey: string,
      queryKey: MediaQueryKey,
      index?: number,
    ) => {
      const mediaLists = useMediaListStore.getState().mediaLists;
      const currentMedia = get().media;
      if (index === undefined) {
        index = 0;
      }

      const audiofile = mediaLists[storeKey][index];

      if (
        storeKey === currentMedia?.storeKey &&
        audiofile.id === currentMedia?.audiofile.id
      ) {
        videoElement.pause();
        videoElement.currentTime = 0;
        return videoElement.play();
      } else {
        return loadMedia({ index, audiofile, storeKey, queryKey });
      }
    },
    unloadMedia: () => {
      const { _setPlaybackState, _setMediaState: _setMedia } = get();
      _setPlaybackState("unloaded");
      _setMedia(undefined);
      videoElement.pause();
    },
    playbackState: "unloaded",
    _setPlaybackState: (state) => {
      set(() => ({
        playbackState: state,
      }));
    },
    play: async () => {
      const { playbackState, unloadMedia } = get();
      if (playbackState === "paused") {
        try {
          await videoElement.play();
        } catch (error) {
          unloadMedia();
          throw error;
        }
      }
    },
    pause: () => {
      if (get().playbackState === "playing") {
        videoElement.pause();
      }
    },
    playPauseToggle: () => {
      const { playbackState, play } = get();
      if (playbackState == "playing") {
        videoElement.pause();
      } else if (playbackState === "paused") {
        return play();
      }
    },
    mute: false,
    _setMuteState: (mute: boolean) => {
      set(() => ({
        mute,
      }));
    },
    setMute: (mute) => {
      videoElement.muted = mute;
    },
    volume: DEFAULT_VOLUME,
    _setVolumeState: (volume: number) => {
      set(() => ({
        volume,
      }));
    },
    setVolume: (volume) => {
      videoElement.volume = volume;
    },
    getSeek: () => {
      const currentMedia = get().media;
      if (!currentMedia) {
        return 0;
      }
      return videoElement.currentTime;
    },
    setSeek: (pos) => {
      videoElement.currentTime = pos;
    },
    next: () => playNextPrev("next"),
    prev: () => playNextPrev("prev"),
  };
});

//event listeners to listen for events from the video element
videoElement.addEventListener("ended", () => {
  useMediaStore.getState().next();
});

videoElement.addEventListener("play", () => {
  useMediaStore.getState()._setPlaybackState("playing");
});

videoElement.addEventListener("pause", () => {
  useMediaStore.getState()._setPlaybackState("paused");
});

videoElement.addEventListener("volumechange", (e) => {
  const target = e.target as HTMLVideoElement;
  useMediaStore.getState()._setVolumeState(target.volume);
  useMediaStore.getState()._setMuteState(target.muted);
});

export function isBrowserSupported(): boolean {
  return shaka.Player.isBrowserSupported();
}

export async function initPlayer(onError: ((error: any) => void) | null) {
  shaka.polyfill.installAll();

  player = new shaka.Player();
  await player.attach(videoElement);

  const netEngine = player.getNetworkingEngine();
  if (!netEngine) {
    throw new Error("Networking engine not found");
  }

  netEngine.registerRequestFilter(async (type, request) => {
    if (
      type === shaka.net.NetworkingEngine.RequestType.MANIFEST ||
      type === shaka.net.NetworkingEngine.RequestType.SEGMENT
    ) {
      const original_url = request.uris[0];
      const object_name = original_url.slice(original_url.lastIndexOf("/") + 1);
      const cdn_url = CDN_URL + `/${object_name}`;
      request.headers["Authorization"] = `Bearer ${deliverableToken}`;
      request.uris[0] = cdn_url;
    }
  });

  player.configure({
    streaming: {
      lowLatencyMode: true,
      rebufferingGoal: 0.01, // minimun buffere before playback
      bufferingGoal: 10, // buffer ahead of the playhead
      bufferBehind: 30, // max buffer size behind the playhead
    },
  });

  player.addEventListener("error", onError);
}

export function formatDuration(duration?: number | null): string {
  if (duration === null || duration === undefined) return "--:--";
  duration = Math.floor(duration);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
