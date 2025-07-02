import {
  PropsWithChildren,
  createContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { addListeningHistory } from "@/api/requests/media";
import { Audiofile } from "@/api/types/media";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store/store";
import { getNextAudio, loadHls } from "./media-loader";
import Hls from "hls.js";
import { toast } from "sonner";

export type MediaUpdateAction = "next" | "prev";
// Used to update/get media from the same source.

type MediaPlaybackState = "unloaded" | "playing" | "loading" | "paused";

export type CurrentMedia = {
  index?: number;
  mediaStoreKey: string;
  audiofile: Audiofile;
};
export type MediaContextValue = {
  getMedia: () => CurrentMedia | undefined;
  setMedia: (mediaStoreKey: string, index?: number) => Promise<void>;
  unload: () => any;
  playbackState: MediaPlaybackState;
  play: () => void;
  pause: () => void;
  playPauseToggle: () => void;
  setMute: (mute: boolean) => void;
  mute: boolean;
  volume: number;
  setVolume: (volume: number) => void;
  getSeek: () => number;
  setSeek: (position: number) => void;
  playNext: () => void;
  playPrev: () => void;
};

const DEFAULT_VOLUME = 0.7;
export const mediaContext = createContext<MediaContextValue | undefined>(
  undefined,
);

export function MediaContextProvider({ children }: PropsWithChildren) {
  const videoRef = useRef<HTMLVideoElement>(document.createElement("video"));
  const hlsRef = useRef<Hls>();
  const [_volume, _setVolume] = useState(DEFAULT_VOLUME);
  const [_mute, _setMute] = useState(false);
  const [playbackState, setPlaybackState] =
    useState<MediaPlaybackState>("unloaded");
  const [currentMedia, setCurrentMedia] = useState<CurrentMedia>();
  const currentMediaList = useStore(
    useShallow((state) => {
      if (!currentMedia) {
        return undefined;
      } else if (!state.mediaLists[currentMedia.mediaStoreKey]) {
        return undefined;
      } else {
        return state.mediaLists[currentMedia.mediaStoreKey];
      }
    }),
  );

  useEffect(() => {
    const videoElement = videoRef.current;
    videoElement.playsInline = true; // avoids mobile full screen video
    videoElement.style.display = "none";
    videoElement.style.width = "0";
    videoElement.style.height = "0";
    videoElement.style.position = "absolute";
    videoElement.style.visibility = "hidden";
    videoElement.volume = DEFAULT_VOLUME;
    document.body.appendChild(videoElement);
    // unload all media when this component unmounts
    return () => {
      unloadMedia();
      if (videoElement) {
        document.body.removeChild(videoElement);
      }
    };
  }, []);

  useEffect(() => {
    videoRef.current.addEventListener("ended", onEnded);
    videoRef.current.addEventListener("play", onPlay);
    videoRef.current.addEventListener("pause", onPause);
    videoRef.current.addEventListener("volumechange", onVolumeChange);
    return () => {
      videoRef.current.removeEventListener("ended", onEnded);
      videoRef.current.removeEventListener("play", onPlay);
      videoRef.current.removeEventListener("pause", onPause);
      videoRef.current.removeEventListener("volumechange", onVolumeChange);
    };
  }, [onEnded, onPlay, onPause, onVolumeChange]);

  // volume and mute

  function onEnded() {
    if (!currentMedia || !currentMediaList) {
      unloadMedia();
    } else {
      playNextPrev("next");
    }
  }
  function onPlay() {
    setPlaybackState("playing");
  }
  function onPause() {
    setPlaybackState("paused");
  }
  function onVolumeChange(e: Event) {
    const target = e.target as HTMLVideoElement;
    _setVolume(target.volume);
    _setMute(target.muted);
  }

  function pause() {
    if (playbackState === "playing") {
      videoRef.current.pause();
    }
  }

  async function play() {
    if (playbackState === "paused") {
      try {
        await videoRef.current.play();
      } catch (error) {
        // unload media to avoid inconsistent states
        unloadMedia();
        // in case caller wants to do extra error handling
        // like UI feedback to the user
        throw error;
      }
    }
  }

  async function playPauseToggle() {
    if (playbackState == "playing") {
      videoRef.current.pause();
    } else if (playbackState === "paused") {
      await play();
    }
  }

  async function loadMedia(newMedia: CurrentMedia) {
    if (!newMedia) {
      unloadMedia();
      return;
    }
    setPlaybackState("loading");
    destroyHls();

    const audiofile = newMedia.audiofile;

    try {
      const loadRes = await loadHls(audiofile.id, videoRef.current);
      if (audiofile.duration === undefined || audiofile.duration === null) {
        // sometimes the server does not successfully get a value for duration
        newMedia.audiofile.duration = loadRes.duration;
      }
      setCurrentMedia(newMedia);
      await videoRef.current.play();
    } catch (error: any) {
      unloadMedia();
      throw error;
    }
    try {
      addListeningHistory(audiofile.id);
    } catch (error) {}
  }
  function unloadMedia() {
    destroyHls();
    setPlaybackState(() => "unloaded");
    setCurrentMedia(() => undefined);
  }

  function destroyHls() {
    hlsRef.current?.destroy();
    hlsRef.current = undefined;
  }

  function getMedia() {
    return currentMedia;
  }

  /**
   * Updates the current audiofile and begins loading it.The updater function will be called to get track corresponding
   * to the action passed to the function. This updater function MUST be specific to the component that passed it to this function.
   */
  async function setMedia(mediaStoreKey: string, index?: number) {
    if (index === undefined) {
      index = 0;
    }
    const audiofile = useStore.getState().mediaLists[mediaStoreKey][index];
    if (
      mediaStoreKey === currentMedia?.mediaStoreKey &&
      audiofile.id === currentMedia?.audiofile.id
    ) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      await videoRef.current.play();
    } else {
      return loadMedia({ index, audiofile, mediaStoreKey });
    }
  }

  function setVolume(volume: number) {
    videoRef.current.volume = volume;
  }

  function setMute(mute: boolean) {
    videoRef.current.muted = mute;
  }

  async function playNextPrev(action: MediaUpdateAction) {
    if (!currentMedia || !currentMediaList) {
      unloadMedia();
      return;
    }
    if (playbackState === "playing") {
      videoRef.current.pause();
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
        videoRef.current.currentTime = 0;
        await videoRef.current.play();
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

  function getSeek() {
    if (!currentMedia) {
      return 0;
    }
    return videoRef.current.currentTime;
  }

  function setSeek(pos: number) {
    videoRef.current.currentTime = pos;
  }

  return (
    <mediaContext.Provider
      value={{
        setMedia,
        getMedia,
        unload: () => setCurrentMedia(undefined),
        playbackState,
        pause,
        play,
        playPauseToggle,
        setMute,
        mute: _mute,
        volume: _volume,
        setVolume,
        getSeek,
        setSeek,
        playNext: () => playNextPrev("next"),
        playPrev: () => playNextPrev("prev"),
      }}
    >
      {children}
    </mediaContext.Provider>
  );
}
