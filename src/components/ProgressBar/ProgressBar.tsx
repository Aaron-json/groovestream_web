import "./ProgressBar.css";

type ProgressBarProps = ProgressProps | LoadingProps

type ProgressProps = {
  mode: "progress"
  total: number
  current: number
};
type LoadingProps = {
  mode: "loading"
}
export default function ProgressBar(props: ProgressBarProps) {
  // if any of the tasks have progress we need to keep track of their

  function getDisplay() {
    if (props.mode === "loading") {
      // none of the tasks have progress set or
      // all tasks with progress are done but not yet removed
      return <div className="loading-bar"></div>;
    } else {
      return (
        <div
          className="progress-bar"
          style={{ width: `${(props.current / props.total) * 100}%` }}
        ></div>
      );
    }
  }
  return (
    <div className="progress-bar-container">
      {/* In loading mode we do not provide the width since it is fixed */}
      {/* {If there are tasks that show progress and some that dont, display
      a progress bar with the sum of those that do have progress. When those are done,
      show a loading bar} */}
      {getDisplay()}
    </div>
  );
}
