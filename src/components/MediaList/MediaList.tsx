import {
  options_icon,
  delete_icon,
  playlist_icon,
} from "../../assets/default-icons";
import { uploadIcon } from "../../assets/default-icons/MediaList";
import "./MediaList.css";
import { useContext, useRef, useState } from "react";
import { mediaContext } from "../../contexts/MediaContext";
import { formatDistanceToNow, set } from "date-fns";
import { FileInput, Modal } from "../";
import {
  getSongIcon,
  getPlaylistIcon,
  supportedAudioFormats,
} from "../../util/media/media";
import { FileInputError } from "../FileInput/FileInput";
import {
  deleteAudioFile,
  deletePlaylist,
  uploadAudioFile,
} from "../../api/requests/media";
import { useNavigate } from "react-router-dom";
import { MediaTask, TaskType, tasksContext } from "../../contexts/TasksContext";
import { AudioFile, MediaType, Playlist } from "../../types/media";
import { AxiosError } from "axios";
import { ResponseError } from "../../types/errors";
interface MediaListOptions {}
interface MediaListProps {
  items: (Playlist | AudioFile)[];
  searchValue?: string;
  refreshMedia?: () => any;
  title?: string;
  songClickHandler?: () => any;
  playlistClickHandler?: () => any;
  filterOptions?: MediaListOptions;
}

export default function MediaList({
  items,
  refreshMedia,
  title,
  songClickHandler,
  playlistClickHandler,
}: MediaListProps) {
  /**
   * @param {Array} mediaList - the original list of media to be modified
   * @param {string} searchFilter - search value used to filter the media
   * @returns {Array} a NEW array after the filters have been applied.
   * does NOT modify original array
   */
  return (
    <div className="media-list-div">
      {title && (
        // render header ii title is passed or if we are displaying a nested media list
        <div className="media-list-header">
          {/*react will not render the title if it is a null object */}
          <h2 className="media-list-title">{title}</h2>
        </div>
      )}
      {items && items.length > 0 ? (
        <ol className="media-list">
          {items.map((media, index) => {
            // return all the objects inside the category
            if (media.type === MediaType.AudioFile) {
              return (
                <AudioFileTille
                  key={media.storageId}
                  audioFile={media}
                  index={index}
                  songClickHandler={songClickHandler}
                  allMedia={items}
                  refreshMedia={refreshMedia}
                />
              );
            } else if (media.type === MediaType.Playlist) {
              return (
                <PlaylistTile
                  key={media.id}
                  playlist={media}
                  playlistClickHandler={playlistClickHandler}
                  refreshMedia={refreshMedia}
                />
              );
            }
          })}
        </ol>
      ) : (
        <NoMediaItem />
      )}
    </div>
  );
}
interface MediaListSong
  extends Pick<MediaListProps, "songClickHandler" | "refreshMedia"> {
  audioFile: AudioFile;
  allMedia: MediaListProps["items"];
  index: number;
}
function AudioFileTille({
  audioFile,
  songClickHandler,
  allMedia,
  index,
  refreshMedia,
}: MediaListSong) {
  const { updateMedia, currentMedia } = useContext(mediaContext)!;
  const [showModal, setShowModal] = useState(false);
  const errMessageRef = useRef<string | undefined>();
  // the media list from mapping all over again
  async function deleteAudioFileHandler() {
    try {
      await deleteAudioFile(audioFile.id, audioFile.storageId);

      refreshMedia && (await refreshMedia());
    } catch (error) {
      console.log("error");
      errMessageRef.current = "Error deleting audiofile";
      setShowModal(true);
    }
  }
  return (
    <li
      className="media-list-song-item"
      onClick={
        songClickHandler ? songClickHandler : () => updateMedia(allMedia, index)
      }
    >
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        children={<span>{errMessageRef.current}</span>}
      />
      <img src={getSongIcon(audioFile)} alt="icon" />
      <div className="media-item-info">
        <span className="media-item-name">{audioFile.filename}</span>
        <span className="media-item-artist">
          {audioFile.artists ? audioFile.artists.join(", ") : "Unknown Artist"}
        </span>
        <span className="media-item-album">
          {audioFile.album ? audioFile.album : "Unknown Album"}
        </span>
        <span className="media-item-date-created">
          Uploaded {formatDistanceToNow(new Date(audioFile.uploadedAt))} ago
        </span>
      </div>
      <span className="media-item-type">
        {currentMedia?.id === audioFile.id ? "Now Playing" : "Song"}
      </span>

      <div className="media-item-options">
        <button
          className="action-icon"
          onClick={(e) => {
            deleteAudioFileHandler();
            e.stopPropagation();
          }}
        >
          <img src={delete_icon} alt="" />
        </button>
        <button className="action-icon" onClick={(e) => e.stopPropagation()}>
          <img src={options_icon} alt="" />
        </button>
      </div>
    </li>
  );
}

interface MediaListPlaylistProps
  extends Pick<MediaListProps, "playlistClickHandler" | "refreshMedia"> {
  playlist: Playlist;
}
function PlaylistTile({
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
      errMessageRef.current = `Unsupported file selected. Supported file types include: ${supportedAudioFormats.join(
        ", "
      )}`;
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
    } catch (e) {}
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

  async function deletePlaylistHandler(e: React.MouseEvent) {
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

function NoMediaItem() {
  return (
    <div className="media-list-song-item">
      <div>No Media</div>
    </div>
  );
}
