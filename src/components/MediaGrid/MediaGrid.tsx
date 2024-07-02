import { useContext } from "react";
import "./MediaGrid.css";
import { mediaContext } from "../../contexts/MediaContext";
import { useNavigate } from "react-router-dom";
import { getSongIcon, getPlaylistIcon } from "../../util/media";
import { AudioFile, MediaType, Playlist } from "../../types/media";
import { getNextAudio } from "../../util/media";
import { MediaUpdaterFunc } from "../../contexts/types";
import { MediaComponentProps } from "../../types/props";

interface MediaGridProps extends MediaComponentProps { }

export default function MediaGrid({ items, title, mediaStoreKey }: MediaGridProps) {
  return (
    <div className="media-grid">
      {
        title &&
        <h2 className="media-grid-title">{title}</h2>
      }
      {items.map((media, index) => {
        if (media.type === MediaType.AudioFile) {
          return (
            <SongTile
              key={media.storageId}
              audioFile={media}
              allMedia={items}
              index={index}
              mediaStoreKey={mediaStoreKey}
            />
          );
        } else if (media.type === MediaType.Playlist) {
          return <PlaylistTile key={media.id} playlist={media as Playlist} />;
        }
      })}
    </div>
  );
}

interface SongTileProps extends Pick<MediaComponentProps, "mediaStoreKey"> {
  audioFile: AudioFile;
  allMedia: MediaGridProps["items"];
  index: number
}

const SongTile = ({ audioFile, allMedia, index, mediaStoreKey }: SongTileProps) => {
  const { currentMedia, setMedia } = useContext(mediaContext)!;
  function onClick() {
    if (mediaStoreKey) {
      setMedia(audioFile, mediaStoreKey, index)
    }
  }
  return (
    <div
      className="media-grid-song-tile tile"
      onClick={onClick}
    >
      <img
        className="media-grid-tile-icon"
        src={getSongIcon(audioFile)}
        alt="icon"
      />
      <div className="media-grid-tile-info">
        <span className="media-grid-tile-name">
          {audioFile.title ? audioFile.title : audioFile.filename}
        </span>
        <span className="media-grid-tile-artist">
          {audioFile.artists ? audioFile.artists.join(", ") : "Unknown Artist"}
        </span>
        <span className="media-grid-tile-album">
          {audioFile.album ? audioFile.album : "Unknown Album"}
        </span>
      </div>
    </div>
  );
};

interface PlaylistTileProps {
  playlist: Playlist;
}
const PlaylistTile = ({ playlist }: PlaylistTileProps) => {
  const navigate = useNavigate();
  return (
    <div
      className="media-grid-playlist-tile tile"
      onClick={() =>
        navigate(`/library/media/1/${playlist.id}`, { state: playlist })
      }
    >
      <img
        className="media-grid-tile-icon"
        src={getPlaylistIcon(playlist)}
        alt="icon"
      />
      <div className="media-grid-tile-info">
        <span className="media-grid-tile-name">{playlist.name}</span>
        <span className="media-grid-tile-type">Album</span>
      </div>
    </div>
  );
};
