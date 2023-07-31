import "./HorizontalScroll.css";
import { library_icon, music_icon } from "../../default-icons";
import React, { useContext } from "react";
import { mediaContext } from "../../contexts/MediaContext";
export default function HorizontalScroll({ items, title }) {
  // remember to get only top 10 for each category
  return (
    <div className="horizontal-scroll">
      <h2 className="horizontal-scroll-title">{title}</h2>
      <div className="scroll-area">
        {items.map((media, index) => (
          <React.Fragment key={media._id}>
            {media.type === 0 && (
              <SongTile media={media} allMedia={items} index={index} />
            )}
            {media.type === 1 && <PlaylistTile media={media} />}
          </React.Fragment>
        ))}
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
        src={
          media.icon
            ? `data:${media.icon.mimeType};base64,${media.icon.data}`
            : music_icon
        }
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
  return (
    <div className="horizontal-scroll-artist-tile home-media-tile">
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
