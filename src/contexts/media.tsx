import React, {
  PropsWithChildren,
  SetStateAction,
  createContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { addListeningHistory } from "@/api/requests/media";
import { Audiofile } from "@/types/media";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store/store";
import { getNextAudio, loadHls } from "./media-loader";
import Hls from "hls.js";

export type MediaUpdateAction = "next" | "prev";
// Used to update/get media from the same source.
export type MediaUpdaterFunc = (
  update: MediaUpdateAction,
) => Audiofile | undefined;

export type MediaPlaybackState = "unloaded" | "playing" | "loading" | "paused";

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
  setMute: React.Dispatch<SetStateAction<boolean>>;
  mute: boolean;
  volume: number;
  setVolume: React.Dispatch<SetStateAction<number>>;
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
  const videoRef = useRef<HTMLVideoElement>();
  const hlsRef = useRef<Hls>();
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [mute, setMute] = useState(false);
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
    const videoElement = document.createElement("video");
    videoElement.style.width = "0";
    videoElement.style.height = "0";
    videoElement.style.position = "absolute";
    videoElement.style.visibility = "hidden";
    videoElement.volume = DEFAULT_VOLUME;
    document.body.appendChild(videoElement);
    videoRef.current = videoElement;
    // unload all media when this component unmounts
    return () => {
      unloadMedia();
      if (videoElement) {
        document.body.removeChild(videoElement);
      }
    };
  }, []);
  // volume and mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = mute;
    }
  }, [volume, mute]);

  async function playPauseToggle() {
    if (!_currentMedia || !videoRef.current) {
      return;
    } else if (playbackState == "playing") {
      videoRef.current.pause();
      setPlaybackState("paused");
    } else if (playbackState === "paused") {
      await videoRef.current.play();
      setPlaybackState("playing");
    }
  }

  async function loadMedia(newMedia: CurrentMedia) {
    if (!newMedia || !videoRef.current) {
      unloadMedia();
      return;
    }
    setPlaybackState(() => "loading");
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
      setPlaybackState(() => "playing");
    } catch (error: any) {
      unloadMedia();
      destroyHls();
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
      videoRef.current &&
      mediaStoreKey === _currentMedia?.mediaStoreKey &&
      audiofile.id === _currentMedia?.audiofile.id
    ) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      await videoRef.current.play();
      setPlaybackState("playing");
    } else {
      return loadMedia({ index, audiofile, mediaStoreKey });
    }
  }

  function playNextPrev(action: MediaUpdateAction) {
    if (!_currentMedia || !videoRef.current) {
      unloadMedia();
      return;
    }
    videoRef.current.pause();
    if (!currentMediaList) {
      unloadMedia();
      return;
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
    const nextAudiofile = currentMediaList[nextIndex] as Audiofile;

    loadMedia({ ..._currentMedia, audiofile: nextAudiofile, index: nextIndex });
  }

  function getSeek() {
    if (videoRef.current) {
      return videoRef.current.currentTime;
    }
    return 0;
  }
  function setSeek(pos: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = pos;
    }
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
        mute,
        volume,
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
