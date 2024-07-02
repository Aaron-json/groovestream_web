import {
  options_icon,
  delete_icon,
} from "../../assets/default-icons";
import { uploadIcon } from "../../assets/default-icons/MediaList";
import "./MediaList.css";
import { useContext, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { FileInput, Modal } from "../";
import { getPlaylistIcon } from "../../util/media";
import {
  MAX_AUDIOFILE_UPLOAD_SIZE,
  supportedAudioFormats,
} from "../../util/constants";
import { FileInputError } from "../FileInput/FileInput";
import {
  deletePlaylist,
  uploadAudioFile,
} from "../../api/requests/media";
import { useNavigate } from "react-router-dom";
import { tasksContext } from "../../contexts/TasksContext";
import { Playlist } from "../../types/media";
import { MediaListProps } from "./MediaList";

interface MediaListPlaylistProps
  extends Pick<MediaListProps, "playlistClickHandler" | "refreshMedia"> {
  playlist: Playlist;
}
export function MediaListPlaylistTile({
  playlist,
  playlistClickHandler,
  refreshMedia,
}: MediaListPlaylistProps) {
  const navigator = useNavigate();
  const { addTask, updateTask, removeTask } = useContext(tasksContext)!;
  const [showErr, setShowErr] = useState(false);
  const errMessageRef = useRef<string | undefined>();
  async function addSongToPlaylistHandler(
    formData: FormData | undefined,
    error: FileInputError | undefined
  ) {
    if (error || !formData) {
      errMessageRef.current = error?.message;
      setShowErr(true);
      return;
    }
    try {
      await uploadAudioFile(formData, playlist.id, {
        addTask,
        removeTask,
        updateTask,
      });
      refreshMedia && (await refreshMedia());
    } catch (e) { }
  }
  function handlePlaylistClick() {
    if (playlistClickHandler) {
      playlistClickHandler();
    } else {
      navigator(`/library/media/${playlist.type}/${playlist.id}`, {
        state: playlist,
      });
    }
  }

  async function deletePlaylistHandler(_: React.MouseEvent) {
    /**
     * Function for deleting any type of media.
     * FUnction is shared so it is on the parent list.
     */
    try {
      await deletePlaylist(playlist.id);
      refreshMedia && (await refreshMedia());
    } catch (error: any) {
      switch (error.response?.data.code) {
        case "INV01":
          errMessageRef.current = "You are not the owner of this playlist";
          break;

        default:
          errMessageRef.current = "Could not delete playlist";
          break;
      }
      setShowErr(true);
    }
  }
  return (
    <li className="media-list-playlist-item" onClick={handlePlaylistClick}>
      <Modal
        show={showErr}
        onClose={() => setShowErr(false)}
        children={<p>{errMessageRef.current}</p>}
      />
      <img loading="lazy" src={getPlaylistIcon(playlist)} alt="icon" />
      <div className="media-item-info">
        <span className="media-item-name">{playlist.name}</span>
        {/* <span className="playlist-files-count">
          Songs: {playlist.audioFiles.length}
        </span> */}
        <span className="media-item-date-created">
          Created {formatDistanceToNow(new Date(playlist.createdAt))} ago
        </span>
      </div>
      <span className="media-item-type">Playlist</span>
      <div className="media-item-options" onClick={(e) => e.stopPropagation()}>
        <label className="action-icon">
          <img src={uploadIcon} alt="" />
          <FileInput
            onInput={addSongToPlaylistHandler}
            formats={supportedAudioFormats}
            multiple={true}
            sizeLimit={MAX_AUDIOFILE_UPLOAD_SIZE}
          />
        </label>
        <button className="action-icon" onClick={deletePlaylistHandler}>
          <img src={delete_icon} alt="" />
        </button>

        <button className="action-icon">
          <img src={options_icon} alt="" />
        </button>
      </div>
    </li>
  );
}


