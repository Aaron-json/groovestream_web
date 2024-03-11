import "./PlaylistPage.css";
import { useLocation, useParams } from "react-router-dom";
import { FileInput, MediaList, Modal, ProgressBar } from "../../components";
import {
  getPlaylistAudioFiles,
  uploadAudioFile,
  sendPlaylistInvite,
  getPlaylistInfo,
} from "../../api/requests/media";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "../../components/Spinner/Spinner";
import { getPlaylistIcon, supportedAudioFormats } from "../../util/media/media";
import { FileInputError } from "../../components/FileInput/FileInput";
import { social_icon } from "../../assets/default-icons/SideBar";
import { FormEvent, useContext, useState } from "react";
import { MediaTask, TaskType, tasksContext } from "../../contexts/TasksContext";
import { Playlist } from "../../types/media";
import { AxiosError } from "axios";
import { ResponseError } from "../../types/errors";
import { validateUsername } from "../../validation/FormInput";
import { FormState } from "../../types/formstate";

export default function PlaylistPage() {
  // playlistID will always be ine url to navigate to this page
  // so it will not be undefined. it is safe to use non-null assertion on it
  const _playlist: Playlist = useLocation().state;
  const { mediaID: playlistID } = useParams();
  const { getPlaylistTasks } = useContext(tasksContext)!;
  const tasks = getPlaylistTasks(+playlistID!);
  const [addingMember, setAddingMember] = useState(false);
  const {
    data: audiofiles,
    error: audiofilesErr,
    isLoading: audiofilesLoading,
    refetch: refetchAudioFiles,
  } = useQuery({
    queryKey: ["playlist-audiofiles", playlistID],
    queryFn: async () => getPlaylistAudioFiles(+playlistID!),
  });
  const {
    data: playlist,
    error: playlistErr,
    isLoading: playlistLoading,
    refetch: refetchPlaylist,
  } = useQuery({
    queryKey: ["playlist", playlistID],
    queryFn: async () => {
      //check if playlist is in current location state.
      // some endpoints will have the full playlist before navigating
      // to this endpoint so they will store the playlist info in the location state.
      // if the previous navigator did not have the full playlist but just the id,
      // then use the id from the url params to get the playlist info
      if (!_playlist) {
        return getPlaylistInfo(+playlistID!);
      }
      return _playlist;
    },
  });
  const { addTask, removeTask, updateTask } = useContext(tasksContext)!;
  if (audiofilesLoading || playlistLoading) {
    return (
      <div className="loading-div">
        <LoadingSpinner size={70} />
      </div>
    );
  }
  if (audiofilesErr || playlistErr) {
    <span>Error Occured</span>;
  }
  async function handleUploadSongToPlaylist(
    formData: FormData | undefined,
    error: FileInputError | undefined
  ) {
    if (!formData || error) {
      return;
    }
    try {
      await uploadAudioFile(formData, Number(playlistID!), {
        addTask,
        removeTask,
        updateTask,
      });
      await refetchAudioFiles();
    } catch (error) {}
  }

  return (
    <section className="playlist-page">
      <div className="playlist-page-background">
        <img src={getPlaylistIcon(playlist!)} alt="" />
      </div>
      <Modal
        show={addingMember}
        onClose={() => setAddingMember(false)}
        children={
          <AddSharedPlaylistMember
            onFinish={() => setAddingMember(false)}
            playlistID={playlistID!}
          />
        }
      />
      <div className="playlist-page-header">
        <div className="playlist-page-header-left">
          <h1>{playlist!.name}</h1>
          <h2>Playlist</h2>
        </div>
        <div className="playlist-page-header-right">
          <div className="playlist-page-header-options">
            <img
              onClick={() => setAddingMember(true)}
              className="action-icon"
              src={social_icon}
              alt=""
            />
          </div>
        </div>
      </div>
      <hr />
      <label className="add-resource-button">
        Upload Song
        <FileInput
          formats={supportedAudioFormats}
          multiple
          onInput={handleUploadSongToPlaylist}
        />
      </label>
      <div className="playlist-page-content">
        {tasks.length > 0 && <ProgressBar tasks={tasks} />}
        <MediaList items={audiofiles!} refreshMedia={refetchAudioFiles} />
      </div>
    </section>
  );
}

type AddSharedPlaylistMemberProps = {
  playlistID: string;
  onFinish: () => any;
};
function AddSharedPlaylistMember({
  playlistID,
  onFinish,
}: AddSharedPlaylistMemberProps) {
  const [username, setUsername] = useState("");
  const [formState, setFormState] = useState<FormState>({ state: "input" });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormState({ state: "loading" });
    const validationErr = validateUsername(username);
    if (validationErr) {
      setFormState({ state: "error", message: "Invalid username" });
      return;
    }
    try {
      await sendPlaylistInvite(+playlistID, username);
      setFormState({ state: "submitted", message: "Invite Sent" });
      onFinish();
    } catch (error: any) {
      let message;
      switch (error.response?.data.code) {
        case "INV01":
          message = "Could not find user";
          break;
        case "INV02":
          message = "Cannot invite yourself to a playlist";
          break;
        case "INV03":
        case "INV04":
          message = "User is already in this playlist";
          break;
        case "INV05":
          message = "You have already invites this user";
          break;
        default:
          message = "Request failed";
          break;
      }
      setFormState({ state: "error", message });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="add-playlist-member-form">
      <h2>Invite User to Playlist</h2>
      {(formState.state === "error" || formState.state === "submitted") && (
        <h3 className="form-err-message">{formState.message}</h3>
      )}
      <label>
        Enter their username
        <input
          className="form-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </label>
      <button className="form-button">
        {formState.state === "loading" ? "Loading..." : "Invite Member"}
      </button>
    </form>
  );
}
