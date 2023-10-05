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

interface MediaContextValue {
        currentMedia: AudioFile,
        updateMedia: (mediaList:any[], index:number) => void,
        player:MediaPlayer,
        playbackState:string,
        playPauseToggle: () => void,
        setMute: React.Dispatch<SetStateAction<boolean>>,
        mute: boolean,
        volume: number,
        setVolume: React.Dispatch<SetStateAction<number>>,
        seek : number,
        setSeek: React.Dispatch<SetStateAction<number>>,
        playNext: () => void,
        playPrev: () => void,
}
export const mediaContext = createContext<MediaContextValue | undefined>(undefined);
const player = new MediaPlayer();
type mediaReducer = Reducer<MediaState, mediaStateAction>
const currentMediaReducer : mediaReducer = (state, action) : MediaState => {
  switch (action.type) {
    case "next":
      if (!state.queue || !state.index) return state;

      let nextIndex = (state.index + 1) % state.queue.length;

      while (state.queue[nextIndex].type !== 0) {
        // loop to the next audioFile i.e type = 0
        // there will be at least 1 audioFile since only audioFiles clicks
        // can set the currentMedia
        nextIndex = (nextIndex + 1) % state.queue.length;
      }
      if (nextIndex === state.index) {
        return state;
      }
      return { ...state, index: nextIndex };
    case "previous":
      if (!state.queue || !state.index) return state;

      let prevIndex = mod(state.index - 1, state.queue.length);
      while (state.queue[prevIndex].type !== 0) {
        // loop to the previous audioFile i.e type = 0
        // there will be at least 1 audioFile since only audioFiles clicks
        // can set the currentMedia
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

    case "unload":
      return { queue: null, index: null };
    default:
      return state;
  }
};

export const MediaContextProvider:React.FC<ContextProvider> = ({ children }) => {
  const { accessTokenRef, request } = useContext(authenticationContext)!;

  const [seek, setSeek] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [mute, setMute] = useState(false);
  const [playbackState, setPlaybackState] = useState(player.getState());

  // reducer is optimal since we expect currentMedia to change when index OR both to change
  // alsp supports future complex features eq. playNext queue
  const [currentMediaStates, currentMediaDispatch] = useReducer<mediaReducer>(currentMediaReducer,
    {
      queue: undefined,
      index: undefined,
    }
  );

  //convenience object to prevent destructuring to access the actual current media object
  // when queue is null or defined so is the index which means if queue not null you can assume that
  // index will also not be null
  const currentMediaObj = currentMediaStates.queue
    ? currentMediaStates.queue[currentMediaStates.index!]
    : null;

  //load media when current media changes
  useEffect(() => {
    if (!currentMediaObj) {
      return;
    }
    loadMedia();
    return () => {
      // unload any current audio when component unmounts
      console.log("unloading media");
    };
  }, [currentMediaStates]);

  useEffect(() => {
    // cleanup for when the media context unmounts, unload the source
    // DO NOT place with the useEffect that changes the current media
    // it will cause media to be unloaded and set back to null on every media change
    return () => {
      unloadMedia();
    };
  }, []);

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
  async function loadMedia() {
    /**
     * Downloads the current media and loads it to the Music player
     */
    if (!currentMediaObj) {
      return;
    }
    //unload current source before loading the new source
    setPlaybackState("loading");
    try {
      const { _id, format } = currentMediaObj;

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
      // hardcode the state as a literal since the player object's state is "loading"
      // immediately after calling play
      setPlaybackState("playing");
    } catch (err) {
      console.log(err);
      unloadMedia();
    }
  }

  function unloadMedia() {
    player.unloadSource();
    currentMediaDispatch({ type: "unload" });
    setPlaybackState("unloaded");
  }

  function updateMedia(mediaList : AudioFile[], index = 0) {
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
      player.getState() !== "playing"
    ) {
      player.stop();
      player.play();
      setPlaybackState("playing");
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
      setPlaybackState(player.getState());
    }
  }
  function playNext() {
    if (!currentMediaObj) return;
    player.stop();
    currentMediaDispatch({
      type: "next",
    });
    // Call play() method anyways. loadMedia function will play automatically
    // however, if the "next" operation gives the same song as the current, then
    // the load function will not be called sicne media is already loaded
    // player.play();
    // setPlaybackState("playing");
  }
  function playPrev() {
    if (!currentMediaObj) return;

    player.stop();
    currentMediaDispatch({
      type: "previous",
    });
    // Call play() method anyways. loadMedia function will play automatically
    // however, if the "next" operation gives the same song as the current, then
    // the load function will not be called sicne media is already loaded
    // player.play();
    // setPlaybackState("playing");
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
function mod(n:number, m:number) {
  return ((n % m) + m) % m;
}
