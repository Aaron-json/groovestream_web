import React, {
  Reducer,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import MediaPlayer from "../global/MediaPlayer";
import axiosClient from "../api/axiosClient";
import { authenticationContext } from "./AuthenticationContext";
import { flushSync } from "react-dom";

interface MediaContextValue {
  currentMedia: AudioFile | undefined;
  updateMedia: (mediaList: any[], index: number) => void;
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
}

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
type mediaReducer = Reducer<CurrentMedia, mediaStateAction>;
const currentMediaReducer: mediaReducer = (state, action): CurrentMedia => {
  switch (action.type) {
    case "next":
      if (!state) return state;

      let nextIndex = (state.index + 1) % state.queue.length;

      while (
        state.queue[nextIndex].type !== 0 &&
        state.queue[nextIndex].type !== 2
      ) {
        // loop to the next audioFile i.e type = 0
        // there will be at least 1 audioFile since only audioFiles clicks
        // can set the currentMedia
        nextIndex = (nextIndex + 1) % state.queue.length;
      }
      if (nextIndex === state.index) {
        return undefined;
      }
      return { ...state, index: nextIndex };
    case "previous":
      if (!state) return state;

      let prevIndex = mod(state.index - 1, state.queue.length);
      while (
        state.queue[prevIndex].type !== 0 &&
        state.queue[prevIndex].type !== 2
      ) {
        // loop to the previous audioFile i.e type = 0
        // there will be at least 1 audioFile since only audioFiles clicks
        // can set the currentMedia
        prevIndex = mod(prevIndex - 1, state.queue.length);
      }
      if (prevIndex === state.index) {
        return undefined;
      }
      return { ...state, index: prevIndex };
    case "newMedia":
      // set a new queue and index entirely
      const { queue, index } = action.payload;
      return { index, queue };

    case "unload":
      return undefined;
    default:
      return state;
  }
};

export const MediaContextProvider: React.FC<ContextProvider> = ({
  children,
}) => {
  const { accessTokenRef, request } = useContext(authenticationContext)!;

  const [seek, setSeek] = useState(0);
  const [ifSeeking, setIfSeeking] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [mute, setMute] = useState(false);
  const [playbackState, setPlaybackState] =
    useState<MediaPlaybackState>("unloaded");

  // reducer is optimal since we expect currentMedia to change when index OR both to change
  // alsp supports future complex features eq. playNext queue
  const [currentMediaStates, currentMediaDispatch] = useReducer<mediaReducer>(
    currentMediaReducer,
    undefined
  );

  useEffect(() => {
    // cleanup for when the media context unmounts, unload the source
    // DO NOT place with the useEffect that changes the current media
    // it will cause media to be unloaded and set back to null on every media change
    return unloadMedia;
  }, []);
  //load media when current media changes
  useEffect(() => {
    if (!currentMediaStates) {
      return;
    }
    loadMedia();
  }, [currentMediaStates]);

  useEffect(() => {
    let timeout: number | undefined;
    if (playbackState === "playing" && !ifSeeking) {
      timeout = setInterval(() => {
        // seek will not be null since
        flushSync(() => setSeek(Math.round(player.getSeek())));
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
    if (player.isPlaying()) {
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
  async function loadMedia() {
    /**
     * Downloads the current media and loads it to the Music player
     */
    if (!currentMediaStates) {
      return;
    }
    console.log(currentMediaStates);
    //unload current source before loading the new source
    // react will not batch updates so no need to use fluShSync
    setPlaybackState("loading");

    try {
      const { _id, format } =
        currentMediaStates.queue[currentMediaStates.index];

      const response = await request(async () => {
        return await axiosClient.get(`/media/0/${_id}`, {
          headers: {
            Authorization: `Bearer ${accessTokenRef.current}`,
          },
        });
      });
      await player.loadSource({
        data: `data:${format.mimeType};base64,${response.data}`,
        _id,
      });
      player.play();
      setPlaybackState("playing");
    } catch (err) {
      console.log(err);
      unloadMedia();
    }
  }

  function unloadMedia() {
    player.unloadSource();
    // usually only playback state is flushed immediately but these state updates
    // are next to each other so flush together
    // do both synchronously since they are next to thother
    currentMediaDispatch({ type: "unload" });
    setPlaybackState("unloaded");
    setSeek(0);
  }

  function updateMedia(mediaList: AudioFile[], index = 0) {
    /**
     * Updates media given a list of media and its index in the list.
     * Restarts the same song if the given media is already the current media
     */
    if (
      currentMediaStates &&
      mediaList[index]._id ===
        currentMediaStates.queue[currentMediaStates.index]?._id &&
      mediaList === currentMediaStates.queue &&
      index === currentMediaStates.index
    ) {
      if (playbackState === "playing") {
        player.stop();
        player.play();
      } else {
        player.stop();
        player.play();
        setPlaybackState("playing");
      }
    } else {
      // place all state changes here so react batches them together
      // for a single rerender
      player.pause();
      currentMediaDispatch({
        type: "newMedia",
        payload: {
          queue: mediaList,
          index: index,
        },
      });
    }
  }
  function updateSeek(seekPosition: number) {
    player.setSeek(seekPosition);
  }
  function playNext() {
    if (!currentMediaStates) return;
    player.stop();
    setPlaybackState("stopped");
    currentMediaDispatch({
      type: "next",
    });

    // Call play() method anyways. loadMedia function will play automatically
    // however, if the "next" operation gives the same song as the current, then
    // the load function will not be called sicne media is already loaded
  }
  function playPrev() {
    if (!currentMediaStates) return;

    player.stop();
    setPlaybackState("stopped");
    currentMediaDispatch({
      type: "previous",
    });
    // Call play() method anyways. loadMedia function will play automatically
    // however, if the "next" operation gives the same song as the current, then
    // the load function will not be called sicne media is already loaded
  }

  return (
    <mediaContext.Provider
      value={{
        currentMedia: currentMediaStates
          ? currentMediaStates.queue[currentMediaStates.index]
          : undefined,
        updateMedia,
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
