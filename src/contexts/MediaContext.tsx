import React, {
  SetStateAction,
  createContext,
  useEffect,
  useState,
} from "react";
import MediaPlayer from "../MediaPlayer/MediaPlayer";
import { addListeningHistory } from "../api/requests/media";
import { AudioFile } from "../types/media";
import { ContextProviderProps, CurrentMedia, MediaUpdateAction } from "./types";
import { MediaPlaybackState } from "../MediaPlayer/MediaPlayer";
import { useMediaStore } from "../state/store";
import { getNextAudio } from "../util/media";

const DEFAULT_VOLUME = 0.7

export type MediaContextValue = {
  currentMedia: AudioFile | undefined;
  setMedia: (audiofile: AudioFile, mediaStoreKey: string, index: number) => void;
  unload: () => any;
  player: MediaPlayer;
  playbackState: MediaPlaybackState;
  playPauseToggle: () => void;
  setMute: React.Dispatch<SetStateAction<boolean>>;
  mute: boolean;
  volume: number;
  setVolume: React.Dispatch<SetStateAction<number>>;
  getSeek: () => number;
  setSeek: (position: number) => void
  playNext: () => void;
  playPrev: () => void;
};
export const mediaContext = createContext<MediaContextValue | undefined>(
  undefined
);

const player = new MediaPlayer();

export function MediaContextProvider({
  children,
}: ContextProviderProps) {
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [mute, setMute] = useState(false);
  const [playbackState, setPlaybackState] =
    useState<MediaPlaybackState>("unloaded");
  const [_currentMedia, _setCurrentMedia] = useState<CurrentMedia | undefined>(undefined);
  const mediaStore = useMediaStore((state) => state.mediaLists);

  useEffect(() => {
    // unload all media when this component unmounts
    return () => unloadMedia();
  }, []);
  // volume
  useEffect(() => {
    player.setVolume(volume);
  }, [volume]);

  // mute
  useEffect(() => {
    player.mute(mute);
  }, [mute]);

  function playPauseToggle() {
    if (!_currentMedia) {
      return;
    } else if (player.isPlaying()) {
      player.pause();
      setPlaybackState("paused");
    } else if (
      !player.isPlaying() && (
        playbackState === "stopped" ||
        playbackState === "paused"
      )) {
      player.play();
      setPlaybackState("playing");
    }
  }
  function onSongEnd() {
    playNextPrev("next");
  }

  async function loadMedia(newMedia: CurrentMedia) {
    if (!newMedia) {
      unloadMedia();
      return;
    }
    setPlaybackState(() => "loading");

    // use type any since the playlistID is on some playables but not all
    const { id, format, storageId, duration } = newMedia.audiofile;

    try {
      await player.loadSource({
        id: storageId,
        format: format.mimeType,
        onSongEnd,
      });
      if (duration === undefined || duration === null) {
        // sometimes the server did not successfully get a value for duration
        newMedia.audiofile.duration = player.getDuration();
      }
      _setCurrentMedia(newMedia);
      player.play();
      setPlaybackState(() => "playing");
    } catch (error) {
      unloadMedia();
      return;
    }
    try {
      addListeningHistory(id);
    } catch (error) { }
  }
  function unloadMedia() {
    player.unloadSource();
    setPlaybackState("unloaded");
    _setCurrentMedia(undefined);
  }

  /**
   * Updates the current audiofile and begins loading it.The updater function will be called to get track corresponding
   * to the action passed to the function. This updater function MUST be specific to the component that passed it to this function.
   */
  function setMedia(audiofile: AudioFile, mediaStoreKey: string, index: number) {
    if (mediaStoreKey === _currentMedia?.mediaStoreKey && audiofile.id === _currentMedia?.audiofile.id) {
      player.stop()
      player.play()
      setPlaybackState("playing")
    } else (
      loadMedia({ index, audiofile, mediaStoreKey })
    )
  }

  function playNextPrev(action: MediaUpdateAction) {
    if (!_currentMedia) {
      unloadMedia()
      return
    }
    player.stop();
    const nextIndex = getNextAudio(mediaStore[_currentMedia.mediaStoreKey], _currentMedia.audiofile, _currentMedia.index, action)
    if (nextIndex === -1) {
      unloadMedia()
      return
    }
    const nextAudiofile = mediaStore[_currentMedia.mediaStoreKey][nextIndex] as AudioFile

    loadMedia({ ..._currentMedia, audiofile: nextAudiofile, index: nextIndex });
  }

  return (
    <mediaContext.Provider
      value={{
        currentMedia: _currentMedia?.audiofile,
        setMedia,
        unload: () => _setCurrentMedia(undefined),
        player,
        playbackState,
        playPauseToggle,
        setMute,
        mute,
        volume,
        setVolume,
        getSeek: () => player.getSeek(),
        setSeek: (pos: number) => player.setSeek(pos),
        playNext: () => playNextPrev("next"),
        playPrev: () => playNextPrev("prev"),
      }}
    >
      {children}
    </mediaContext.Provider>
  );
};

