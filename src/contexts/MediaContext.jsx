import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import MediaPlayer from "../global/MediaPlayer";
import axiosClient from "../api/axiosClient";
import { authenticationContext } from "./AuthenticationContext";
import { retryRequest } from "../api/requests";
import { flushSync } from "react-dom";

export const mediaContext = createContext();
const player = new MediaPlayer();

const currentMediaReducer = (state, action) => {
  switch (action.type) {
    case "next":
      if (!state.queue) return;

      let nextIndex = (state.index + 1) % state.queue.length;
      console.log(nextIndex, state.queue.length);

      while (state.queue[nextIndex].type !== 0) {
        // loop to the next audioFile i.e type = 0
        // there will be at least 1 audioFile since only audioFiles clicks
        // can set the currentMedia
        nextIndex = (nextIndex + 1) % state.queue.length;
        console.log(nextIndex, state.queue.length);
      }
      if (nextIndex === state.index) {
        return state;
      }
      return { ...state, index: nextIndex };
    case "previous":
      if (!state.queue) return;

      //let prevIndex = (state.index - 1) % state.queue.length;
      let prevIndex = mod(state.index - 1, state.queue.length);
      while (state.queue[prevIndex].type !== 0) {
        // loop to the previous audioFile i.e type = 0
        // there will be at least 1 audioFile since only audioFiles clicks
        // can set the currentMedia
        // prevIndex = (prevIndex - 1) % state.queue.length;
        prevIndex = mod(prevIndex - 1, state.queue.length);
      }
      if (prevIndex === state.index) {
        return state;
      }
      return { ...state, index: prevIndex };
    case "newMedia":
      // set a new queue and index entirely
      const { queue, index } = action.payload;
      return { index, queue };
    default:
      return state;
  }
};

export const MediaContextProvider = ({ children }) => {
  const { accessTokenRef, refreshAuthentication } = useContext(
    authenticationContext
  );

  const [seek, setSeek] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [mute, setMute] = useState(false);
  const [playbackState, setPlaybackState] = useState(player.getState());

  // reducer is optimal since we expect currentMedia to change when index OR both to change
  // alsp supports future complex features eq. playNext queue
  const [currentMediaStates, currentMediaDispatch] = useReducer(
    currentMediaReducer,
    {
      queue: null,
      index: null,
    }
  );

  //convenence object to prevent destructuring to access the actual current media object
  const currentMediaObj = currentMediaStates.queue
    ? currentMediaStates.queue[currentMediaStates.index]
    : null;

  //load media when current media changes
  useEffect(() => {
    if (!currentMediaObj) {
      return;
    }
    loadMedia();
    return () => {
      // unload any current audio if component unmounts
      player.unloadSource();
    };
  }, [currentMediaStates]);

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
    if (player.getState() === "playing") {
      player.pause();
      setPlaybackState(player.getState());
    } else if (player.getState() === "loaded") {
      player.play();
      setPlaybackState("playing");
    }
  }

  function updateSeek(position) {
    /**
     * This functionality SHOULD NOT be implemented with useEffect since seek could be updated
     * from both the UI and from the Music Player. This could cause an infinite loop
     */
    setSeek(position);
  }

  async function loadMedia() {
    /**
     * Downloads the current media and loads it to the Music player
     */
    if (!currentMediaObj) {
      return;
    }
    const { _id, format, type } = currentMediaObj;

    const response = await retryRequest(async () => {
      return await axiosClient.get(`/media/${type}/${_id}`, {
        headers: {
          Authorization: `Bearer ${accessTokenRef.current}`,
        },
      });
    }, refreshAuthentication);
    await player.loadSource({
      data: `data:${format.mimeType};base64,${response.data}`,
      _id,
    });
    player.play();
    // hardcode the state as a literal since the player object's state is "loading"
    // immediately after calling play
    setPlaybackState("playing");
  }

  function updateMedia(mediaList, index = 0) {
    /**
     * Updates media given a list of media and its index in the list.
     * Restarts the same song if the given media is already the current media
     */
    if (
      mediaList[index]._id === currentMediaObj?._id &&
      player.getState() === "playing"
    ) {
      player.stop();
      player.play();
    } else if (
      mediaList[index]._id === currentMediaObj?._id &&
      player.getState() === "loaded"
    ) {
      player.stop();
      player.play();
      setPlaybackState("playing");
    } else {
      // place all state changes here so react batches them together
      // for a single rerender
      player.pause();
      setPlaybackState("loading");
      currentMediaDispatch({
        type: "newMedia",
        payload: {
          queue: mediaList,
          index: index,
        },
      });
      setPlaybackState(player.getState());
    }
  }
  function playNext() {
    player.stop();
    flushSync(() => {
      setPlaybackState("stopped");
    });
    flushSync(() => {
      currentMediaDispatch({
        type: "next",
      });
    });
    // Call play() method anyways. loadMedia function will play automatically
    // however, if the "next" operation gives the same song as the current, then
    // the load function will not be called sicne media is already loaded
    player.play();
    flushSync(() => {
      setPlaybackState("playing");
    });
  }
  function playPrev() {
    player.stop();
    setPlaybackState(player.getState());
    currentMediaDispatch({
      type: "previous",
    });
    // Call play() method anyways. loadMedia function will play automatically
    // however, if the "next" operation gives the same song as the current, then
    // the load function will not be called sicne media is already loaded
    player.play();
    setPlaybackState("playing");
  }

  return (
    <mediaContext.Provider
      value={{
        currentMedia: currentMediaObj,
        updateMedia,
        player,
        playbackState,
        playPauseToggle,
        setMute,
        mute,
        volume,
        setVolume,
        seek,
        setSeek,
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
function mod(n, m) {
  return ((n % m) + m) % m;
}
