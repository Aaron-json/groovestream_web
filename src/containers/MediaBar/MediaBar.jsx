import "./MediaBar.css";
import { MediaInfo, PlaybackControls, VolumeControl } from "../../components";

const MediaBar = (props) => {
  return (
    <section className="MediaBar">
      <MediaInfo />
      <PlaybackControls />
      <VolumeControl />
    </section>
  );
};

export default MediaBar;
