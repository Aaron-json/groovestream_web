import { FormEventHandler } from "react";
import { useState } from "react";
import "./CreatePlaylist.css";
import { createPlaylist } from "../../api/requests/media";
import { validatePlaylistName } from "../../validation/media";

interface CreatePlaylistProps {
  // function to execute after playlist has been created
  // typically for the parent to refresh their playlist list
  // or to close the modal if this component is in a modal
  onFinish: () => any;
}
export default function CreatePlaylist({ onFinish }: CreatePlaylistProps) {
  const [formState, setFormState] = useState<FormState>({ state: "input" });
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
      await createPlaylist(playlistName);
      setFormState({ state: "submitted", message: "Playlist created" });
      onFinish();
    } catch (err) {}
  };
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
