import { FormEventHandler } from "react";
import { useState } from "react";
import "./CreatePlaylist.css";
import { createPlaylist } from "../../api/requests/media";
import { validatePlaylistName } from "../../api/validation/media";

interface CreatePlaylistProps {
  // function to execute after playlist has been created
  // typically for the parent to refresh their playlist list
  // or to close the modal if this component is in a modal
  onFinish: () => any;
}
export default function CreatePlaylist({ onFinish }: CreatePlaylistProps) {
  const [formState, setFormState] = useState<FormState>({ state: "input" });
  const [playlistType, setPlaylistType] = useState<1 | 3>(1);
  const [playlistName, setPlaylistName] = useState("");

  const submitHandler: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setFormState({ state: "loading" });
    try {
      const ifValidName = validatePlaylistName(playlistName);
      if (!ifValidName) {
        setFormState({ state: "error", message: "Invalid Name" });
        return;
      }
      if (playlistType === 1) {
        await createPlaylist(playlistName, 1);
      } else if (playlistType === 3) {
        await createPlaylist(playlistName, 3);
      }
      setFormState({ state: "submitted", message: "Playlist created" });
      onFinish();
    } catch (err) {
      console.log(err);
    }
  };
  function getPlaylistClassName(playlistType: 1 | 3) {
    if (playlistType === playlistType) {
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
      <h3 className="form-err-message">
        {formState.state === "error" && formState.message}
      </h3>
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
          className={getPlaylistClassName(1)}
        >
          Playlist
        </span>
        <span
          onClick={() => setPlaylistType(3)}
          className={getPlaylistClassName(3)}
        >
          Shared Playlist
        </span>
      </div>
      <button
        type="submit"
        disabled={formState.state === "loading"}
        className="form-button"
      >
        {formState.state === "loading" ? "Loading..." : "Create"}
      </button>
    </form>
  );
}
