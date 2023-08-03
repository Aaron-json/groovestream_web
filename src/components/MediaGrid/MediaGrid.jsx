import React, { useContext, useEffect, useState } from "react";
import "./MediaGrid.css";
import { library_icon, music_icon } from "../../default-icons";
import { mediaContext } from "../../contexts/MediaContext";
import { useNavigate } from "react-router-dom";

export default function MediaGrid({ items, title }) {
  // remember to only get the last 6 or 9 items
  return (
    <div className="media-grid">
      <h2 className="media-grid-title">{title}</h2>
      {items.map((media, index) => {
        return (
          <React.Fragment key={media._id}>
            {media.type === 0 && (
              <SongTile media={media} allMedia={items} index={index} />
            )}
            {media.type === 1 && <PlaylistTile media={media} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
const SongTile = ({ media, allMedia, index }) => {
  const { updateMedia } = useContext(mediaContext);

  return (
    <div
      className="media-grid-song-tile home-media-tile"
      onClick={() => updateMedia(allMedia, index)}
    >
      <img
        className="media-grid-tile-icon"
        src={
          media.icon
            ? `data:${media.icon.mimeType};base64,${media.icon.data}`
            : music_icon
        }
        alt="icon"
      />
      <div className="media-grid-tile-info">
        <span className="media-grid-tile-name">
          {media.title ? media.title : media.filename}
        </span>
        <span className="media-grid-tile-artist">
          {media.artists ? media.artists.join(", ") : "Unknown Artist"}
        </span>
        <span className="media-grid-tile-album">
          {media.album ? media.album : "Unknown Album"}
        </span>
      </div>
    </div>
  );
};
const PlaylistTile = ({ media }) => {
  const navigate = useNavigate();
  return (
    <div
      className="media-grid-playlist-tile home-media-tile"
      onClick={() => navigate(`/media/1/${media._id}`, { state: media })}
    >
      <img className="media-grid-tile-icon" src={library_icon} alt="icon" />
      <div className="media-grid-tile-info">
        <span className="media-grid-tile-name">{media.name}</span>
        <span className="media-grid-tile-type">Album</span>
      </div>
    </div>
  );
};
