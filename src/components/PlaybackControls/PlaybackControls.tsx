import "./PlaybackControls.css";
import { play, pause, back, next } from "../../assets/default-icons/MediaBar";
import { useContext } from "react";
import { mediaContext } from "../../contexts/MediaContext";

const PlaybackControls = () => {
  const {
    currentMedia,
    playbackState,
    playPauseToggle,
    seek,
    setSeek,
    playNext,
    playPrev,
  } = useContext(mediaContext)!;

  function parseSeconds(secondsCount: number) {
    // takes in number of seconds and returns it in the format
    // hours: seconds: minutes
    const seconds = secondsCount % 60;
    const totalMinutes = Math.floor(secondsCount / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}:${minutes}:${seconds}`;
  }
  return (
    <div className="playback-controls-div">
      <div className="playback-control-buttons">
        <button className="playback-control-btn" onClick={playPrev}>
          <img src={back} alt="back" />
        </button>
        <button className="playback-control-btn" onClick={playPauseToggle}>
          <img src={playbackState === "playing" ? pause : play} alt="play" />
        </button>
        <button className="playback-control-btn" onClick={playNext}>
          <img src={next} alt="next" />
        </button>
      </div>
      <div className="playback-tracking-div">
        <label htmlFor="seeker" className="seeker-label">
          {parseSeconds(seek)}
        </label>
        <input
          id="seeker"
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
          onChange={(e) => setSeek(Number(e.target.value))}
        />
        <label htmlFor="seeker" className="seeker-label">
          {currentMedia && currentMedia.duration
            ? parseSeconds(Math.round(currentMedia.duration))
            : parseSeconds(0)}
        </label>
      </div>
    </div>
  );
};

export default PlaybackControls;