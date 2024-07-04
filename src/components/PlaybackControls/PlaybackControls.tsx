import "./PlaybackControls.css";
import {
  play as playIcon,
  pause as pauseIcon,
  back as backIcon,
  next as nextIcon,
  loading as loadingIcon,
} from "../../assets/default-icons/MediaBar";
import { useContext, useEffect, useState } from "react";
import { mediaContext } from "../../contexts/MediaContext";

const PlaybackControls = () => {
  const {
    currentMedia,
    playbackState,
    playPauseToggle,
    setSeek,
    getSeek,
    playNext,
    playPrev,
  } = useContext(mediaContext)!;
  const [displaySeek, setDisplaySeek] = useState(0)
  const [ifSeeking, setIfSeeking] = useState(false);

  useEffect(() => {
    let timeout: number | undefined;
    if (playbackState === "unloaded" || playbackState === "loading" || playbackState === "stopped") {
      setDisplaySeek(0)
    } else {
      if (!ifSeeking) {
        timeout = setInterval(() => {
          setDisplaySeek(Math.round(getSeek()));
        }, 1e3);
      }
    }
    return () => clearInterval(timeout);
  }, [playbackState, ifSeeking]);

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
  function handlePointerUp(e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) {
    setSeek(e.currentTarget.valueAsNumber);
    setDisplaySeek(e.currentTarget.valueAsNumber)
    setIfSeeking(false);
  }
  function handlePointerDown(_: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) {
    setIfSeeking(true)
  }
  function handlePointerInput(e: React.MouseEvent<HTMLInputElement>) {
    setDisplaySeek(e.currentTarget.valueAsNumber)
  }
  return (
    <div className="playback-controls-comp">
      <div className="playback-buttons-div">
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
        <label className="left-seeker-label">{formatSeconds(displaySeek)}</label>
        <input
          type="range"
          max={
            currentMedia && currentMedia.duration
              ? Math.round(currentMedia.duration)
              : 0
          }
          min={0}
          step={1}
          value={displaySeek}

          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}

          onInput={handlePointerInput}

          onMouseUp={handlePointerUp}
          onTouchEnd={handlePointerUp}
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
