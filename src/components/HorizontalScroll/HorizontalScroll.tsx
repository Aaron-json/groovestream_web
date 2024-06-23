import "./HorizontalScroll.css";
import { useContext } from "react";
import { mediaContext } from "../../contexts/MediaContext";
import { useNavigate } from "react-router-dom";
import { getSongIcon, getPlaylistIcon } from "../../util/media";
import { AudioFile, MediaType, Playlist } from "../../types/media";
import { getNextAudio } from "../../util/media";
interface HorizontalScrollProps {
  items: (AudioFile | Playlist)[];
  title: string;
}
export default function HorizontalScroll({
  items,
  title,
}: HorizontalScrollProps) {
  // remember to get only top 10 for each category
  return (
    <div className="horizontal-scroll">
      <h2 className="horizontal-scroll-title">{title}</h2>
      <div className="scroll-area">
        {items.map((media) => {
          if (media.type === MediaType.AudioFile) {
            return (
              <SongTile
                key={media.storageId}
                audioFile={media}
                allMedia={items}
              />
            );
          } else if (media.type === MediaType.Playlist) {
            return <PlaylistTile key={media.id} playlist={media as Playlist} />;
          }
        })}
      </div>
    </div>
  );
}
interface SongTileProps {
  audioFile: AudioFile;
  allMedia: HorizontalScrollProps["items"];
}
const SongTile = ({ audioFile, allMedia }: SongTileProps) => {
  const { setMedia, currentMedia } = useContext(mediaContext)!;
  return (
    <div
      className="horizontal-scroll-song-tile tile"
      onClick={() => setMedia(audioFile, (action) => {
        if (currentMedia) {
          return getNextAudio((allMedia as AudioFile[]), currentMedia.id, action)
        } else {
          return undefined
        }
      }
      )}
    >
      <img
        className="horizontal-scroll-media-icon"
        src={getSongIcon(audioFile)}
        alt="icon"
      />
      <div className="horizontal-scroll-media-info">
        <span className="horizontal-scroll-media-name">
          {audioFile.filename}
        </span>
        <span className="horizontal-scroll-media-artist">
          {audioFile.artists ? audioFile.artists.join(", ") : "Unknown Artist"}
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
      className="horizontal-scroll-artist-tile tile"
      onClick={() =>
        navigate(`/library/media/1/${playlist.id}`, { state: playlist })
      }
    >
      <img
        className="horizontal-scroll-media-icon"
        src={getPlaylistIcon(playlist)}
        alt="icon"
      />
      <div className="horizontal-scroll-media-info">
        <span className="horizontal-scroll-media-name">{playlist.name}</span>
      </div>
    </div>
  );
};
