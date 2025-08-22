import { Audiofile } from "@/api/types/media";
import { create } from "zustand";
import { MediaQueryKey } from "@/hooks/media";
import {
  addListeningHistory,
  getDeliverables,
  getObjectUrl,
} from "@/api/requests/media";
import Hls, {
  HlsConfig,
  LoaderCallbacks,
  LoaderConfiguration,
  LoaderContext,
} from "hls.js";
import { toast } from "sonner";

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

let hls: Hls | undefined = undefined;

function destroyHls() {
  hls?.destroy();
  hls = undefined;
}

class CustomLoader extends Hls.DefaultConfig.loader {
  async load(
    context: LoaderContext,
    config: LoaderConfiguration,
    callbacks: LoaderCallbacks<LoaderContext>,
  ): Promise<void> {
    try {
      const object_name = context.url.slice(context.url.lastIndexOf("/") + 1);
      const signed_url = await getObjectUrl(object_name);
      context = { ...context, url: signed_url };
      super.load(context, config, callbacks);
    } catch (error) {
      // Handle any errors in getting signed URL
      callbacks.onError(
        { code: 500, text: "Error fetching URL" },
        context,
        null,
        super.stats,
      );
    }
  }
}

const HLS_CONFIG: Partial<HlsConfig> = {
  loader: CustomLoader,
  enableWorker: true,
  lowLatencyMode: true,
  backBufferLength: 90,
  // Add specific audio optimization configs
  maxBufferLength: 30, // 30s
  maxMaxBufferLength: 60, // 60s
  maxBufferSize: 20 * 1000 * 1000, // 20MB
  // Optimize for audio-only streams
  progressive: true,
  manifestLoadingTimeOut: 10000, // 10s
  manifestLoadingMaxRetry: 2,
  levelLoadingTimeOut: 10000, // 10s
  fragLoadingTimeOut: 10000, // 10s
};

interface HlsLoadResult {
  duration: number;
}

async function loadHls(audiofile_id: number, video: HTMLVideoElement) {
  const deliverables = await getDeliverables(audiofile_id);
  const hlsDeliverables = deliverables.filter(
    (deliverable) =>
      deliverable.protocol === "hls" && deliverable.codec === "aac",
  );
  if (hlsDeliverables.length === 0) {
    throw new Error("No deliverables found");
  }

  // TODO: add more info in the backend for selection
  const deliverable = hlsDeliverables[0];

  const hls = new Hls(HLS_CONFIG);
  return new Promise<HlsLoadResult>((resolve, reject) => {
    let mediaAttached = false;
    let levelLoaded = false;
    let duration = 0;

    function tryResolve() {
      if (mediaAttached && levelLoaded) {
        resolve({
          duration,
        });
        // remove error listener to avoid shadowing future hls errors
        hls.off(Hls.Events.ERROR);
      }
    }

    hls.once(Hls.Events.MEDIA_ATTACHED, function () {
      mediaAttached = true;
      tryResolve();
    });

    hls.once(Hls.Events.LEVEL_LOADED, function (_, data) {
      levelLoaded = true;
      duration = Math.round(data.details.totalduration);
      tryResolve();
    });

    hls.once(Hls.Events.ERROR, function (_, data) {
      reject(data);
      hls.destroy();
    });

    hls.loadSource(deliverable.manifest_file);
    hls.attachMedia(video);
  });
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
  destroyHls();

  const audiofile = newMedia.audiofile;

  try {
    const loadRes = await loadHls(audiofile.id, videoElement);
    if (audiofile.duration === undefined || audiofile.duration === null) {
      // sometimes the server does not successfully get a value for duration
      newMedia.audiofile.duration = loadRes.duration;
    }
    _setMedia(newMedia);
    await videoElement.play();
  } catch (error: any) {
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
      let mediaLists = useMediaListStore.getState().mediaLists;
      let currentMedia = get().media;
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
      destroyHls();
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
      let currentMedia = get().media;
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

export function formatDuration(duration?: number | null): string {
  if (duration === null || duration === undefined) return "--:--";
  duration = Math.floor(duration);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
