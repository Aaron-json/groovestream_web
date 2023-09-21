import "./HorizontalScroll.css";
import { library_icon, music_icon } from "../../default-icons";
import React, { useContext } from "react";
import { mediaContext } from "../../contexts/MediaContext";
import { useNavigate } from "react-router-dom";
import { mediaIcon } from "../../global/media";
export default function HorizontalScroll({ items, title }) {
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
                media={media}
                allMedia={items}
                index={index}
              />
            );
          } else if (media.type === 1) {
            return <PlaylistTile key={media._id} media={media} />;
          }
        })}
      </div>
    </div>
  );
}
const SongTile = ({ media, allMedia, index }) => {
  const { updateMedia } = useContext(mediaContext);
  return (
    <div
      className="horizontal-scroll-song-tile home-media-tile"
      onClick={() => updateMedia(allMedia, index)}
    >
      <img
        className="horizontal-scroll-media-icon"
        src={mediaIcon(media)}
        alt="icon"
      />
      <div className="horizontal-scroll-media-info">
        <span className="horizontal-scroll-media-name">{media.filename}</span>
        <span className="horizontal-scroll-media-artist">
          {media.artists ? media.artists.join(", ") : "Unknown Artist"}
        </span>
      </div>
    </div>
  );
};
const PlaylistTile = ({ media }) => {
  const navigate = useNavigate();
  return (
    <div
      className="horizontal-scroll-artist-tile home-media-tile"
      onClick={() => navigate(`/media/1/${media._id}`, { state: media })}
    >
      <img
        className="horizontal-scroll-media-icon"
        src={library_icon}
        alt="icon"
      />
      <div className="horizontal-scroll-media-info">
        <span className="horizontal-scroll-media-name">{media.name}</span>
      </div>
    </div>
  );
};
