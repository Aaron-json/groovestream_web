import { FormEventHandler } from "react";
import axiosClient from "../../api/axiosClient";
import { useContext, useState } from "react";
import "./CreatePlaylist.css";
import { authenticationContext } from "../../contexts/AuthenticationContext";

interface CreatePlaylistProps {
  onFinish: () => any;
}
export default function CreatePlaylist({ onFinish }: CreatePlaylistProps) {
  const { request, accessTokenRef } = useContext(authenticationContext)!;
  const [isLoading, setIsLoading] = useState(false);
  async function createPlaylist(playlistName: String) {
    await request(async () => {
      axiosClient.post(
        "/media/1",
        {
          name: playlistName,
        },
        {
          headers: {
            Authorization: `Bearer ${accessTokenRef.current}`,
          },
        }
      );
    });
  }

  const submitHandler: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const playlistName = (
      document.getElementById("create-playlist-name-input") as HTMLInputElement
    ).value;
    try {
      await createPlaylist(playlistName);
      onFinish();
    } catch (err) {
      console.log(err);
    }
    setIsLoading(false);
  };
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
        id="create-playlist-name-input"
        type="text"
      />
      <button type="submit" disabled={isLoading} className="form-button">
        {isLoading ? "Loading" : "Create"}
      </button>
    </form>
  );
}