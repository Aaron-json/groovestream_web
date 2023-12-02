import "./HorizontalScroll.css";
import { useContext } from "react";
import { mediaContext } from "../../contexts/MediaContext";
import { useNavigate } from "react-router-dom";
import { getSongIcon, getPlaylistIcon } from "../../global/media/media";
interface HorizontalScrollProps {
  items: Array<AudioFile | PlaylistAudioFile | Playlist>;
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
        {items.map((media, index) => {
          if (media.type === 0 || media.type === 2) {
            return (
              <SongTile
                key={media._id}
                audioFile={media as AudioFile | PlaylistAudioFile}
                allMedia={items}
                index={index}
              />
            );
          } else if (media.type === 1) {
            return (
              <PlaylistTile key={media._id} playlist={media as Playlist} />
            );
          }
        })}
      </div>
    </div>
  );
}
interface SongTileProps {
  audioFile: AudioFile | PlaylistAudioFile;
  allMedia: HorizontalScrollProps["items"];
  index: number;
}
const SongTile = ({ audioFile, allMedia, index }: SongTileProps) => {
  const { updateMedia } = useContext(mediaContext)!;
  return (
    <div
      className="horizontal-scroll-song-tile home-media-tile"
      onClick={() => updateMedia(allMedia, index)}
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
      className="horizontal-scroll-artist-tile home-media-tile"
      onClick={() =>
        navigate(`/library/media/1/${playlist._id}`, { state: playlist })
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
