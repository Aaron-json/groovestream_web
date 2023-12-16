import React, {
  SetStateAction,
  createContext,
  useEffect,
  useState,
} from "react";
import MediaPlayer from "../global/MediaPlayer";
import { streamAudioFile } from "../api/requests/media";

type MediaContextValue = {
  currentMedia: Playable | undefined; // exposed media value. just the current media's object
  updateMedia: (mediaList: any[], index: number) => void;
  unload: () => any;
  player: MediaPlayer;
  playbackState: string;
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

export const MediaContextProvider: React.FC<ContextProvider> = ({
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
  async function loadMedia(newMedia?: CurrentMedia) {
    /**
     * Downloads the current media and loads it to the Music player
     */
    if (!newMedia) {
      unloadMedia();
      return;
    }

    setPlaybackState((prevState) => "loading");
    const mediaObj = newMedia.queue[newMedia.index];

    // use type any since the playlistID is on some playables but not all
    const { _id, format, type, playlistID } = mediaObj as any;

    try {
      console.log(playlistID);
      const audioData = await streamAudioFile(type, _id, playlistID);
      await player.loadSource({
        data: `data:${format.mimeType};base64,${audioData}`,
        _id,
        format: format.mimeType,
        onSongEnd,
      });
      if (!(mediaObj as Playable).duration) {
        // sometimes the server did not successfully get a value for duration
        // add it here
        (mediaObj as Playable).duration = player.getDuration();
      }
      _setCurrentMedia(newMedia);
      setPlaybackState((prevState) => "loaded");
      player.play();
      setPlaybackState((prevState) => "playing");
    } catch (error) {
      console.log("error loading media", error);
      unloadMedia();
    }
  }
  function unloadMedia() {
    player.unloadSource();
    setSeek(0);
    setPlaybackState("unloaded");
    _setCurrentMedia(undefined);
  }
  function updateMedia(mediaList: Media[], index = 0) {
    /**
     * Updates media given a list of media and its index in the list.
     * Restarts the same song if the given media is already the current media
     */
    if (
      _currentMedia &&
      mediaList[index]._id === _currentMedia.queue[_currentMedia.index]?._id &&
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
      // place all state changes here so react batches them together
      // for a single rerender
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

    while (
      _currentMedia.queue[nextIndex].type !== 0 &&
      _currentMedia.queue[nextIndex].type !== 2 &&
      _currentMedia.queue[nextIndex].type !== 4
    ) {
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
          ? (_currentMedia.queue[_currentMedia.index] as Playable) //expose the actual current media's object which will always be a playable object
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
