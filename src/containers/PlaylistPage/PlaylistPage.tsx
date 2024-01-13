import "./PlaylistPage.css";
import { useParams } from "react-router-dom";
import { FileInput, MediaList, Modal } from "../../components";
import {
  getPlaylistData,
  getPlaylistAudioFileInfo,
  uploadAudioFile,
  sendPlaylistInvite,
} from "../../api/requests/media";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "../../components/Spinner/Spinner";
import {
  getPlaylistIcon,
  supportedAudioFormats,
} from "../../global/media/media";
import { FileInputError } from "../../components/FileInput/FileInput";
import { social_icon } from "../../assets/default-icons/SideBar";
import { FormEvent, useContext, useState } from "react";
import { Task, tasksContext } from "../../contexts/TasksContext";

export default function PlaylistPage() {
  // playlistID will always be ine url to navigate to this page
  // so it will not be undefined. it is safe to use non-null assertion on it
  const { mediaID, mediaType } = useParams();
  const [addingMember, setAddingMember] = useState(false);
  const {
    data: playlistData,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["playlist", mediaID],
    queryFn: () => getPlaylistData(mediaType!, mediaID!),
  });
  const { addTask, removeTask, updateTask } = useContext(tasksContext)!;
  if (isLoading) {
    return (
      <div className="loading-div">
        <LoadingSpinner size={70} />
      </div>
    );
  }
  if (error) {
    <span>Error Occured</span>;
  }
  async function handleUploadSongToPlaylist(
    formData: FormData | undefined,
    error: FileInputError | undefined
  ) {
    if (!formData || error) {
      return;
    }
    const taskID = Date.now().toString + (Math.random() * 100).toString();

    const task: Task = {
      mode: "progress",
      progress: 0,
      name: "Uploading audio files",
      originID: mediaID,
    };
    try {
      let audioFileType: 2 | 4;
      switch (playlistData.type) {
        case 1:
          audioFileType = 2;
          break;
        case 3:
          audioFileType = 4;
          break;
        default:
          return;
      }
      await uploadAudioFile(formData, audioFileType, mediaID!, {
        task,
        taskID,
        addTask,
        removeTask,
        updateTask,
      });

      refetch();
    } catch (error) {
      removeTask(taskID);
    }
  }

  return (
    <section className="playlist-page">
      <div className="playlist-page-background">
        <img src={getPlaylistIcon(playlistData)} alt="" />
      </div>
      <Modal
        show={addingMember}
        onClose={() => setAddingMember(false)}
        children={<AddSharedPlaylistMember playlistID={mediaID!} />}
      />
      <div className="playlist-page-header">
        <div className="playlist-page-header-left">
          <h1>{playlistData.name}</h1>
          <h2>Playlist</h2>
        </div>
        <div className="playlist-page-header-right">
          {/* contains all the options ex. add a member for a shared playlist */}
          <div className="playlist-page-header-options">
            {mediaType === "3" && (
              // only for shared playlists
              <img
                onClick={() => setAddingMember(true)}
                className="action-icon"
                src={social_icon}
                alt=""
              />
            )}
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
        <MediaList items={playlistData.audioFiles} refreshMedia={refetch} />
      </div>
    </section>
  );
}

type AddSharedPlaylistMemberProps = {
  playlistID: string;
};
function AddSharedPlaylistMember({ playlistID }: AddSharedPlaylistMemberProps) {
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<FormState>({ state: "input" });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormState({ state: "loading" });

    try {
      await sendPlaylistInvite(playlistID, email);
      setFormState({ state: "submitted", message: "Invite Sent" });
    } catch (error) {
      setFormState({ state: "error", message: "Request failed" });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="add-playlist-member-form">
      <h2>Invite User to Playlist</h2>
      {(formState.state === "error" || formState.state === "submitted") && (
        <h3>{formState.message}</h3>
      )}
      <label>
        Enter recipient email
        <input
          className="form-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <button className="form-button">
        {formState.state === "loading" ? "Loading..." : "Invite Member"}
      </button>
    </form>
  );
}
