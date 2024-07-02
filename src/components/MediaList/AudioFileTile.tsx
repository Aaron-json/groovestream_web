import {
  options_icon,
  delete_icon,
} from "../../assets/default-icons";
import "./MediaList.css";
import { useContext, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Modal } from "../";
import { getSongIcon } from "../../util/media";
import {
  deleteAudioFile
} from "../../api/requests/media";
import { AudioFile } from "../../types/media";
import { mediaContext } from "../../contexts/MediaContext";
import { MediaListProps } from "./MediaList";

interface AudiofileTileProps
  extends Pick<MediaListProps, "songClickHandler" | "refreshMedia"> {
  audioFile: AudioFile;
  allMedia: MediaListProps["items"];
  index: number;
  mediaStoreKey?: string
}

export function MediaListAudioFileTile({
  audioFile,
  songClickHandler,
  allMedia,
  refreshMedia,
  index,
  mediaStoreKey
}: AudiofileTileProps) {
  const { setMedia, currentMedia } = useContext(mediaContext)!;
  const [showModal, setShowModal] = useState(false);
  const errMessageRef = useRef<string | undefined>();

  // the media list from mapping all over again
  async function deleteAudioFileHandler() {
    try {
      await deleteAudioFile(audioFile.id, audioFile.storageId);
      refreshMedia && (await refreshMedia());
    } catch (error) {
      errMessageRef.current = "Error deleting audiofile";
      setShowModal(true);
    }
  }
  function onClickHandler() {
    if (mediaStoreKey) {
      setMedia(audioFile, mediaStoreKey, index)
    }
  }

  return (
    <li
      className="media-list-song-item"
      onClick={songClickHandler || onClickHandler}
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
    </li >
  );
}
