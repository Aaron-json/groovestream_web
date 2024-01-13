import "./ProgressBar.css";
import { LoadingTask, ProgressTask } from "../../contexts/TasksContext";

type ProgressBarProps = {
  // This task does not have to be from the global TasksContext.
  // it just follows the same schema for consistency
  task: ProgressTask | LoadingTask;
};
export default function ProgressBar({ task }: ProgressBarProps) {
  return (
    <div className="progress-bar-container">
      {/* In loading mode we do not provide the width since it is fixed */}
      {task.mode === "loading" && <div className="loading-bar"></div>}
      {task.mode === "progress" && (
        <div
          className="progress-bar"
          style={{ width: `${task.progress * 100}%` }}
        ></div>
      )}
    </div>
  );
}
