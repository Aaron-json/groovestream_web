import "./PlaybackControls.css";
import {
  play as playIcon,
  pause as pauseIcon,
  back as backIcon,
  next as nextIcon,
  loading as loadingIcon,
} from "../../assets/default-icons/MediaBar";
import { useContext } from "react";
import { mediaContext } from "../../contexts/MediaContext";

const PlaybackControls = () => {
  const {
    currentMedia,
    playbackState,
    playPauseToggle,
    seek,
    setSeek,
    setIfSeeking,
    updateSeek,
    playNext,
    playPrev,
  } = useContext(mediaContext)!;

  function getPlaybackIcon() {
    switch (playbackState) {
      case "playing":
        return pauseIcon;
      case "loading":
        return loadingIcon;
      default:
        return playIcon;
    }
  }
  function formatSeconds(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    } else {
      return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }
  }
  return (
    <div className="playback-controls-div">
      <div className="playback-control-buttons">
        <button className="playback-control-btn" onClick={playPrev}>
          <img src={backIcon} alt="back" />
        </button>
        <button className={`playback-control-btn`} onClick={playPauseToggle}>
          <img
            className={playbackState === "loading" ? "loading" : undefined}
            src={getPlaybackIcon()}
            alt="play"
          />
        </button>
        <button className="playback-control-btn" onClick={playNext}>
          <img src={nextIcon} alt="next" />
        </button>
      </div>
      <div className="playback-tracking-div">
        <label className="left-seeker-label">{formatSeconds(seek)}</label>
        <input
          className="seeker"
          type="range"
          max={
            currentMedia && currentMedia.duration
              ? Math.round(currentMedia.duration)
              : 0
          }
          min={0}
          step={1}
          value={seek}
          onMouseDown={() => setIfSeeking(true)}
          onInput={(e) => setSeek(Number(e.currentTarget.value))}
          onMouseUp={() => {
            updateSeek(seek);
            setIfSeeking(false);
          }}
          //onChange={(e) => setSeek(Number(e.target.value))}
        />
        <label className="right-seeker-label">
          {currentMedia && currentMedia.duration
            ? formatSeconds(Math.round(currentMedia.duration))
            : formatSeconds(0)}
        </label>
      </div>
    </div>
  );
};

export default PlaybackControls;
