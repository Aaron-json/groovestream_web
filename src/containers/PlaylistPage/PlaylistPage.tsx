import "./PlaylistPage.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FileInput, MediaList, Modal, ProgressBar } from "../../components";
import {
  uploadAudioFile,
  sendPlaylistInvite,
  getPlaylistInfo,
  leavePlaylist,
} from "../../api/requests/media";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "../../components/Spinner/Spinner";
import { getPlaylistIcon } from "../../util/media";
import {
  MAX_AUDIOFILE_UPLOAD_SIZE,
  PLAYLIST_AUDIOFILES_CACHE_KEY,
  PLAYLIST_INFO_CACHE_KEY,
  supportedAudioFormats,
} from "../../util/constants";
import { FileInputError } from "../../components/FileInput/FileInput";
import { exit_icon, social_icon } from "../../assets/default-icons/SideBar";
import { FormEvent, useContext, useRef, useState } from "react";
import { tasksContext } from "../../contexts/TasksContext";
import { Playlist } from "../../types/media";
import { validateUsername } from "../../validation/FormInput";
import { FormState } from "../../types/formstate";
import { usePlaylistAudioFiles } from "../../hooks/media";

export default function PlaylistPage() {
  // playlistID will always be ine url to navigate to this page
  // so it will not be undefined. it is safe to use non-null assertion
  const _playlist: Playlist = useLocation().state;
  const { mediaID: playlistID } = useParams();
  const { getPlaylistTasks } = useContext(tasksContext)!;
  const tasks = getPlaylistTasks(+playlistID!);
  const [showModal, setShowModal] = useState(false);
  const popupContent = useRef<JSX.Element | undefined>(undefined);

  // audiofiles for the playlist
  const MEDIA_STORE_KEY = PLAYLIST_AUDIOFILES_CACHE_KEY + playlistID
  const {
    data: audiofiles,
    error: audiofilesErr,
    isLoading: audiofilesLoading,
    refetch: refetchAudioFiles,
  } = usePlaylistAudioFiles(
    MEDIA_STORE_KEY,
    +playlistID!,
  );
  const {
    data: playlist,
    error: playlistErr,
    isLoading: playlistLoading,
  } = useQuery({
    queryKey: [PLAYLIST_INFO_CACHE_KEY, playlistID],
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
      popupContent.current = <p>{`${error?.message}`}</p>;
      setShowModal(true);
      return;
    }
    try {
      await uploadAudioFile(formData, Number(playlistID!), {
        addTask,
        removeTask,
        updateTask,
      });
      await refetchAudioFiles();
    } catch (error) { }
  }

  return (
    <section className="playlist-page">
      <div className="playlist-page-background">
        <img src={getPlaylistIcon(playlist!)} alt="" />
      </div>
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        children={popupContent.current}
      />

      <div className="playlist-page-header">
        <div className="playlist-page-header-left">
          <h1>{playlist!.name}</h1>
          <h2>Playlist</h2>
        </div>
        <div className="playlist-page-header-right">
          <div className="playlist-page-header-options">
            <img
              onClick={() => {
                popupContent.current = (
                  <AddSharedPlaylistMember
                    onFinish={() => setShowModal(false)}
                    playlistID={playlistID!}
                  />
                );
                setShowModal(true);
              }}
              className="action-icon"
              src={social_icon}
              alt=""
            />
            <img
              className="action-icon"
              src={exit_icon}
              alt=""
              onClick={() => {
                popupContent.current = (
                  <LeavePlaylist
                    onFinish={() => setShowModal(false)}
                    playlistID={+playlistID!}
                  />
                );
                setShowModal(true);
              }}
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
          sizeLimit={MAX_AUDIOFILE_UPLOAD_SIZE}
        />
      </label>
      <div className="playlist-page-content">
        {tasks.length > 0 && <ProgressBar tasks={tasks} />}
        <MediaList mediaStoreKey={MEDIA_STORE_KEY} items={audiofiles!} refreshMedia={refetchAudioFiles} />
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

interface LeavePlaylistProps {
  playlistID: number;
  onFinish: () => any;
}
function LeavePlaylist({ playlistID, onFinish }: LeavePlaylistProps) {
  const [formState, setFormState] = useState<FormState>({ state: "input" });
  const navigator = useNavigate();

  async function handleSubmit(e: FormEvent) {
    setFormState({ state: "loading" });
    e.preventDefault();
    try {
      await leavePlaylist(playlistID);
      navigator("/library");
      onFinish();
    } catch (error: any) {
      let message;
      switch (error.response?.data.code) {
        case "INV01":
          message = "The owner cannot leave the playlist";
          break;

        default:
          message = "Request failed";
          break;
      }
      setFormState({ state: "error", message });
    }
  }
  return (
    <form className="leave-playlist-form" onSubmit={handleSubmit}>
      <h2>Leave Playlist</h2>
      <hr />
      {formState.state === "error" && (
        <p className="form-err-message">{formState.message}</p>
      )}
      <p>
        Are you sure you want to leave this playlist? Your listening history
        from this playlist will be deleted.
      </p>
      <button
        disabled={formState.state === "loading"}
        type="submit"
        className="form-button"
      >
        {formState.state === "loading" ? "Loading..." : "Leave"}
      </button>
    </form>
  );
}
