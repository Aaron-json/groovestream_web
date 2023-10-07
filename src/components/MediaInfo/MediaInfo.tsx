import { mediaContext } from "../../contexts/MediaContext";
import "./MediaInfo.css";
import { useContext } from "react";
import { sound_waves } from "../../assets/default-icons/MediaBar";
import { getSongIcon } from "../../global/media";

const default_txt_icon = {
  music: sound_waves,
  name: "No Media",
  artist: "Unknown Artist",
  album: "Unknown Album",
};

const MediaInfo = () => {
  const { currentMedia } = useContext(mediaContext)!;
  return (
    <div className="mediabar-media-info">
      <img
        className="mediabar-media-image"
        src={getSongIcon(currentMedia)}
        alt=""
      />
      <div className="mediabar-name-artist-album">
        <span className="name">
          {!currentMedia ? default_txt_icon.name : currentMedia.filename}
        </span>
        <span className="artist">
          {!currentMedia || !currentMedia.artists
            ? default_txt_icon.artist
            : currentMedia.artists.join(", ")}
        </span>
        <span className="album">
          {!currentMedia || !currentMedia.album
            ? default_txt_icon.album
            : currentMedia.album}
        </span>
      </div>
    </div>
  );
};

export default MediaInfo;
