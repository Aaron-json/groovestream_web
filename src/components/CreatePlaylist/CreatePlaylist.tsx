import { FormEventHandler } from "react";
import { useState } from "react";
import "./CreatePlaylist.css";
import { createPlaylist, createSharedPlaylist } from "../../api/requests/media";
import { validatePlaylistName } from "../../api/validation/media";

interface CreatePlaylistProps {
  // function to execute after playlist has been created
  // typically for the parent to refresh their playlist list
  // or to close the modal if this component is in a modal
  onFinish: () => any;
}
export default function CreatePlaylist({ onFinish }: CreatePlaylistProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [playlistType, setPlaylistType] = useState<1 | 3>(1);
  const [playlistName, setPlaylistName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  const submitHandler: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const ifValidName = validatePlaylistName(playlistName);
      if (!ifValidName) {
        setErrorMessage("Invalid Name");
        return;
      }
      if (playlistType === 1) {
        await createPlaylist(playlistName);
      } else if (playlistType === 3) {
        await createSharedPlaylist(playlistName);
      }
      onFinish();
    } catch (err) {
      console.log(err);
    }
    setIsLoading(false);
  };
  function getPlaylistTypeOptionClassName(playlistTypeOption: 1 | 3) {
    if (playlistTypeOption === playlistType) {
      return "create-playlist-type-selected-option";
    } else {
      return "create-playlist-type-option";
    }
  }

  return (
    <form
      className="create-playlist-form"
      onSubmit={submitHandler}
      method="dialog"
    >
      <h2>Create a New Playlist</h2>
      <hr />
      <label
        htmlFor="create-playlist-name-input"
        className="create-playlist-name-label"
      >
        Playlist Name
      </label>
      <input
        className="form-input"
        value={playlistName}
        onChange={(e) => setPlaylistName(e.target.value)}
        type="text"
      />
      <div className="create-playlist-type-div">
        <span
          onClick={() => setPlaylistType(1)}
          className={getPlaylistTypeOptionClassName(1)}
        >
          Playlist
        </span>
        <span
          onClick={() => setPlaylistType(3)}
          className={getPlaylistTypeOptionClassName(3)}
        >
          Shared Playlist
        </span>
      </div>
      <button type="submit" disabled={isLoading} className="form-button">
        {isLoading ? "Loading..." : "Create"}
      </button>
    </form>
  );
}
