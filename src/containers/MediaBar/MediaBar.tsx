import React from "react"
import "./MediaBar.css";
import { MediaInfo, PlaybackControls, VolumeControl } from "../../components";

const MediaBar = () => {
  return (
    <section className="MediaBar">
      <MediaInfo />
      <PlaybackControls />
      <VolumeControl />
    </section>
  );
};

export default MediaBar;
