import "./VolumeControl.css";
import { useContext } from "react";
import { mediaContext } from "../../contexts/MediaContext";
import {
  volume as volumeIcon,
  mute as muteIcon,
} from "../../assets/default-icons/MediaBar";

const VolumeControl = () => {
  const { mute, setMute, volume, setVolume } = useContext(mediaContext)!;
  return (
    <div className="volume-and-devices">
      <div className="volume-group">
        <img
          onClick={() => setMute(!mute)}
          className="volume-icon action-icon"
          src={mute ? muteIcon : volumeIcon}
          alt=""
        />
        <input
          type="range"
          className="volume-slider"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
      </div>
    </div>
  );
};

export default VolumeControl;
