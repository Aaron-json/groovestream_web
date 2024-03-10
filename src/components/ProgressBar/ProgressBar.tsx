import "./ProgressBar.css";
import { Task } from "../../contexts/TasksContext";

type ProgressBarProps = {
  // This task does not have to be from the global TasksContext.
  // it just follows the same schema for consistency
  tasks: Task[];
};
export default function ProgressBar({ tasks }: ProgressBarProps) {
  // if any of the tasks have progress we need to keep track of their
  // progress collectively.
  let total = 0;
  let current = 0;
  let noProgress = false;
  for (const task of tasks) {
    if (task.progress) {
      total += 1;
      current += task.progress;
    } else {
      // if there exists tasks that do not have progress
      noProgress = true;
    }
  }
  function getDisplay() {
    if (total === current) {
      // none of the tasks have progress set or
      // all tasks with progress are done but not yet removed
      return <div className="loading-bar"></div>;
    } else {
      return (
        <div
          className="progress-bar"
          style={{ width: `${current * 100}%` }}
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
