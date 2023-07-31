import React from "react";
import "./ListView.css";

export default function ListView(props) {
  return (
    <ol className="list-view">
      {props.results.map((resultObj) => (
        <React.Fragment key={resultObj.id}>
          {resultObj.type.toLowerCase() === "song" && (
            <SongEntry key={resultObj.id} resultObj={resultObj} />
          )}
          {resultObj.type.toLowerCase() === "album" && (
            <AlbumEntry key={resultObj.id} resultObj={resultObj} />
          )}

          {resultObj.type.toLowerCase() === "artist" && (
            <ArtistEntry key={resultObj.id} resultObj={resultObj} />
          )}
        </React.Fragment>
      ))}
    </ol>
  );
}

const SongEntry = ({ resultObj }) => {
  return (
    <li className="result-entry">
      <button className="result-entry-btn">
        <img className="result-icon" src={resultObj.icon} alt="" />
        <span className="result-name">{resultObj.name}</span>
      </button>
    </li>
  );
};
const AlbumEntry = ({ resultObj }) => {
  return (
    <li className="result-entry">
      <button className="result-entry-btn">
        <img className="result-icon" src={resultObj.icon} alt="" />
        <span className="result-name">{resultObj.name}</span>
      </button>
    </li>
  );
};

const ArtistEntry = ({ resultObj }) => {
  return (
    <li className="result-entry">
      <button className="result-entry-btn">
        <img className="result-icon" src={resultObj.icon} alt="" />
        <span className="result-name">{resultObj.name}</span>
      </button>
    </li>
  );
};
