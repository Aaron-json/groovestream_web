import React, {
  SetStateAction,
  createContext,
  useEffect,
  useState,
} from "react";
import MediaPlayer from "../util/MediaPlayer";
import { addListeningHistory, streamAudioFile } from "../api/requests/media";
import { AudioFile, MediaType, Playlist } from "../types/media";
import { ContextProviderProps, CurrentMedia } from "./types";

type MediaContextValue = {
  currentMedia: AudioFile | undefined; // exposed media value. just the current media's object
  updateMedia: (mediaList: any[], index: number) => void;
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
};

type MediaPlaybackState =
  | "unloaded"
  | "loaded"
  | "playing"
  | "loading"
  | "playing"
  | "stopped"
  | "paused";

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

  // internal media. includes list of media and index of the current media.
  const [_currentMedia, _setCurrentMedia] = useState<CurrentMedia>(undefined);
  useEffect(() => {
    // unload all media when this component unmounts
    return () => unloadMedia();
  }, []);
  useEffect(() => {
    let timeout: number | undefined;
    if (playbackState === "playing" && !ifSeeking) {
      timeout = setInterval(() => {
        // seek will not be null since
        setSeek(() => Math.round(player.getSeek()));
      }, 1000);
    }
    return () => clearInterval(timeout);
  }, [playbackState, ifSeeking]);

  // change volume when state changes
  useEffect(() => {
    player.setVolume(volume);
  }, [volume]);
  // update mute when state changes
  useEffect(() => {
    player.mute(mute);
  }, [mute]);

  function playPauseToggle() {
    /**
     * Function to toggle between play and pause
     */
    if (!_currentMedia) {
      return;
    } else if (player.isPlaying()) {
      player.pause();
      setPlaybackState("paused");
    } else if (
      !player.isPlaying() &&
      playbackState !== "unloaded" &&
      playbackState !== "loading"
    ) {
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
  async function loadMedia(newMedia?: CurrentMedia) {
    /**
     * Downloads the current media and loads it to the Music player
     */
    if (!newMedia) {
      unloadMedia();
      return;
    }

    setPlaybackState(() => "loading");
    const audiofile = newMedia.queue[newMedia.index] as AudioFile;

    // use type any since the playlistID is on some playables but not all
    const { id, format, storageId } = audiofile;

    try {
      const audioData = await streamAudioFile(storageId);
      await player.loadSource({
        data: `data:${format.mimeType};base64,${audioData}`,
        id: storageId,
        format: format.mimeType,
        onSongEnd,
      });
      if (!audiofile.duration) {
        // sometimes the server did not successfully get a value for duration
        // add it here
        audiofile.duration = player.getDuration();
      }
      _setCurrentMedia(newMedia);
      setPlaybackState((prevState) => "loaded");
      player.play();
      setPlaybackState((prevState) => "playing");
    } catch (error) {
      unloadMedia();
      return;
    }
    try {
      addListeningHistory(id);
    } catch (error) {}
  }
  function unloadMedia() {
    player.unloadSource();
    setSeek(0);
    setPlaybackState("unloaded");
    _setCurrentMedia(undefined);
  }
  function updateMedia(mediaList: (AudioFile | Playlist)[], index = 0) {
    /**
     * Updates media given a list of media and its index in the list.
     * Restarts the same song if the given media is already the current media
     */
    if (
      _currentMedia &&
      mediaList[index].id === _currentMedia.queue[_currentMedia.index]?.id &&
      mediaList === _currentMedia.queue &&
      index === _currentMedia.index
    ) {
      // same song from the same current list is clicked.
      if (playbackState === "playing") {
        player.stop();
        player.play();
      } else {
        player.stop();
        player.play();
        setPlaybackState(() => "playing");
      }
    } else {
      player.pause();
      loadMedia({ queue: mediaList, index });
    }
  }
  function updateSeek(seekPosition: number) {
    player.setSeek(seekPosition);
  }
  function playNext() {
    player.stop();
    setSeek(0);
    setPlaybackState("stopped");
    loadMedia(_findNextPrev("next"));
  }
  function playPrev() {
    player.stop();
    setSeek(0);
    setPlaybackState("stopped");
    loadMedia(_findNextPrev("prev"));
  }

  function _findNextPrev(action: "next" | "prev"): CurrentMedia {
    if (!_currentMedia) {
      return undefined;
    }
    function _getnextIdx() {
      if (action === "next") {
        return (_currentMedia!.index + 1) % _currentMedia!.queue.length;
      } else {
        return (_currentMedia!.index - 1) % _currentMedia!.queue.length;
      }
    }
    let nextIndex = _getnextIdx();

    while (_currentMedia.queue[nextIndex].type !== MediaType.AudioFile) {
      // loop to the next audioFile i.e type = 0
      // there will be at least 1 audioFile since only audioFiles clicks
      // can set the currentMedia
      nextIndex = _getnextIdx();
    }
    if (nextIndex === _currentMedia.index) {
      return undefined;
    }
    return { ..._currentMedia, index: nextIndex };
  }

  return (
    <mediaContext.Provider
      value={{
        currentMedia: _currentMedia
          ? (_currentMedia.queue[_currentMedia.index] as AudioFile) //expose the actual current media's object which will always be a playable object
          : undefined,
        updateMedia,
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
      }}
    >
      {children}
    </mediaContext.Provider>
  );
};

/**
 *
 * @param {Number} n
 * @param {Numebr} m - The Modulo
 * @returns {Number} The result of the mathematical n mod m. (Returns only positive numbers)
 */
function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}
