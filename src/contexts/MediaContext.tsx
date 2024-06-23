import React, {
  SetStateAction,
  createContext,
  useEffect,
  useRef,
  useState,
} from "react";
import MediaPlayer from "../MediaPlayer/MediaPlayer";
import { addListeningHistory } from "../api/requests/media";
import { AudioFile } from "../types/media";
import { ContextProviderProps, MediaUpdater } from "./types";
import { MediaPlaybackState } from "../MediaPlayer/MediaPlayer";

type MediaContextValue = {
  currentMedia: AudioFile | undefined;
  setMedia: (audiofile: AudioFile, updater: MediaUpdater) => void;
  unload: () => any;
  player: MediaPlayer;
  playbackState: MediaPlaybackState;
  playPauseToggle: () => void;
  setMute: React.Dispatch<SetStateAction<boolean>>;
  mute: boolean;
  volume: number;
  setVolume: React.Dispatch<SetStateAction<number>>;
  ifSeeking: boolean;
  setIfSeeking: React.Dispatch<SetStateAction<boolean>>;
  seek: number;
  setSeek: React.Dispatch<SetStateAction<number>>;
  updateSeek: (seekPosition: number) => void;
  playNext: () => void;
  playPrev: () => void;
  setMediaUpdater: (func: MediaUpdater) => void;
};
export const mediaContext = createContext<MediaContextValue | undefined>(
  undefined
);
const player = new MediaPlayer();

export const MediaContextProvider: React.FC<ContextProviderProps> = ({
  children,
}) => {
  const [seek, setSeek] = useState(0);
  const [ifSeeking, setIfSeeking] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [mute, setMute] = useState(false);
  const [playbackState, setPlaybackState] =
    useState<MediaPlaybackState>("unloaded");
  const [_currentMedia, _setCurrentMedia] = useState<AudioFile | undefined>(undefined);

  const mediaUpdater = useRef<MediaUpdater>(() => undefined)
  useEffect(() => {
    // unload all media when this component unmounts
    return () => unloadMedia();
  }, []);
  useEffect(() => {
    // updating seeker value
    let timeout: number | undefined;
    if (playbackState === "playing" && !ifSeeking) {
      timeout = setInterval(() => {
        // seek will not be null since
        setSeek(() => Math.round(player.getSeek()));
      }, 1000);
    }
    return () => clearInterval(timeout);
  }, [playbackState, ifSeeking]);

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
    playNext();
  }
  /**
   * Loads the provided track and begins playback
   * @param newMedia
   * @returns
   */
  async function loadMedia(newMedia: AudioFile | undefined) {
    /**
     * Downloads the current media and loads it to the Music player
     */
    if (!newMedia) {
      unloadMedia();
      return;
    }
    setPlaybackState(() => "loading");

    // use type any since the playlistID is on some playables but not all
    const { id, format, storageId, duration } = newMedia;

    try {
      await player.loadSource({
        id: storageId,
        format: format.mimeType,
        onSongEnd,
      });
      if (duration === undefined) {
        // sometimes the server did not successfully get a value for duration
        newMedia.duration = player.getDuration();
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
    setSeek(0);
    setPlaybackState("unloaded");
    _setCurrentMedia(undefined);
  }

  /**
   * Sets the current audiofile and starts loading. optionally you can register an updater
   * function that will be called when the media needs to change. You can also register an updater manuall.
   * Source is helpful to identify the current source of the media inorder to re-register an updater when
   * a rerender happens.
   */
  function setMedia(audiofile: AudioFile, updater?: MediaUpdater) {

    if (audiofile.id == _currentMedia?.id) {
      player.stop()
      player.setSeek(0)
      player.play()
      setPlaybackState("playing")
    } else (
      loadMedia(audiofile)
    )
    if (updater) {
      setMediaUpdater(updater)
    }
  }
  function setMediaUpdater(updater: MediaUpdater) {
    mediaUpdater.current = updater
  }
  function updateSeek(seekPosition: number) {
    player.setSeek(seekPosition);
  }
  function playNext() {
    if (!_currentMedia) {
      unloadMedia()
      return
    }
    player.stop();
    setSeek(0);
    console.log(_currentMedia)
    const nextAudiofile = mediaUpdater.current("next")
    if (!nextAudiofile) {
      unloadMedia()
      return
    }
    loadMedia(nextAudiofile);
  }
  function playPrev() {
    if (!_currentMedia) {
      unloadMedia()
      return
    }
    player.stop();
    setSeek(0);
    setPlaybackState("stopped");
    const nextAudiofile = mediaUpdater.current("prev")
    if (!nextAudiofile) {
      unloadMedia()
      return
    }
    loadMedia(nextAudiofile);
  }
  return (
    <mediaContext.Provider
      value={{
        currentMedia: _currentMedia,
        setMedia,
        unload: () => _setCurrentMedia(undefined),
        player,
        playbackState,
        playPauseToggle,
        setMute,
        mute,
        volume,
        setVolume,
        updateSeek,
        seek,
        setSeek,
        ifSeeking,
        setIfSeeking,
        playNext,
        playPrev,
        setMediaUpdater,
      }}
    >
      {children}
    </mediaContext.Provider>
  );
};

