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
  currentMedia: Audiofile | undefined;
  setMedia: (
    audiofile: Audiofile,
    mediaStoreKey: string,
    index?: number,
  ) => Promise<void>;
  unload: () => any;
  playbackState: MediaPlaybackState;
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
  const [_currentMedia, _setCurrentMedia] = useState<CurrentMedia>();
  const currentMediaList = useStore(
    useShallow((state) => {
      if (!_currentMedia) {
        return undefined;
      } else if (!state.mediaLists[_currentMedia.mediaStoreKey]) {
        return undefined;
      } else {
        return state.mediaLists[_currentMedia.mediaStoreKey];
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
    if (!_currentMedia || !currentMediaList) {
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

  async function playPauseToggle() {
    if (!_currentMedia) {
      return;
    } else if (playbackState == "playing") {
      videoRef.current.pause();
    } else if (playbackState === "paused") {
      await videoRef.current.play();
    }
  }

  async function loadMedia(newMedia: CurrentMedia) {
    if (!newMedia) {
      unloadMedia();
      return;
    }
    setPlaybackState("loading");
    destroyHls();

    // use type any since the playlistID is on some playables but not all
    const audiofile = newMedia.audiofile;
    const playlist_file = audiofile.objects.find((val: string) =>
      val.endsWith(".m3u8"),
    );
    if (playlist_file === undefined) {
      unloadMedia();
      throw new Error("Playlist file not found");
    }
    try {
      const loadRes = await loadHls(playlist_file, videoRef.current);
      if (audiofile.duration === undefined || audiofile.duration === null) {
        // sometimes the server does not successfully get a value for duration
        newMedia.audiofile.duration = loadRes.duration;
      }
      _setCurrentMedia(newMedia);
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
    setPlaybackState("unloaded");
    _setCurrentMedia(undefined);
  }

  function destroyHls() {
    hlsRef.current?.destroy();
    hlsRef.current = undefined;
  }

  /**
   * Updates the current audiofile and begins loading it.The updater function will be called to get track corresponding
   * to the action passed to the function. This updater function MUST be specific to the component that passed it to this function.
   */
  async function setMedia(
    audiofile: Audiofile,
    mediaStoreKey: string,
    index?: number,
  ) {
    if (
      mediaStoreKey === _currentMedia?.mediaStoreKey &&
      audiofile.id === _currentMedia?.audiofile.id
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
    if (!_currentMedia || !currentMediaList) {
      unloadMedia();
      return;
    }
    if (playbackState === "playing") {
      videoRef.current.pause();
    }
    const nextIndex = getNextAudio(
      currentMediaList,
      _currentMedia.audiofile,
      action,
      _currentMedia.index,
    );
    if (nextIndex === -1) {
      unloadMedia();
      return;
    }
    const nextAudiofile = currentMediaList[nextIndex];

    if (nextAudiofile.id === _currentMedia.audiofile.id) {
      try {
        videoRef.current.currentTime = 0;
        await videoRef.current.play();
      } catch (error) {
        unloadMedia();
        toast("Error playing next track");
      }
    } else {
      loadMedia({
        ..._currentMedia,
        audiofile: nextAudiofile,
        index: nextIndex,
      });
    }
  }

  function getSeek() {
    if (!_currentMedia) {
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
        currentMedia: _currentMedia?.audiofile,
        setMedia,
        unload: () => _setCurrentMedia(undefined),
        playbackState,
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
