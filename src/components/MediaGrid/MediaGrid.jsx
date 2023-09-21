import React, { useContext, useEffect, useState } from "react";
import "./MediaGrid.css";
import { library_icon, music_icon } from "../../default-icons";
import { mediaContext } from "../../contexts/MediaContext";
import { useNavigate } from "react-router-dom";
import { mediaIcon } from "../../global/media";

export default function MediaGrid({ items, title }) {
  // remember to only get the last 6 or 9 items
  return (
    <div className="media-grid">
      <h2 className="media-grid-title">{title}</h2>
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
  );
}
const SongTile = ({ media, allMedia, index }) => {
  const { updateMedia } = useContext(mediaContext);

  return (
    <div
      className="media-grid-song-tile home-media-tile"
      onClick={() => updateMedia(allMedia, index)}
    >
      <img className="media-grid-tile-icon" src={mediaIcon(media)} alt="icon" />
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
