import "./TaskProgressBar.css";
import { Task } from "../../contexts/TasksContext";
import { ProgressBar } from "..";

type TaskProgressBarProps = {
  tasks: Task[];
};
export default function TaskProgressBar({ tasks }: TaskProgressBarProps) {
  // if any of the tasks have progress we need to keep track of their
  // progress collectively.
  let total = 0;
  let current = 0;
  for (const task of tasks) {
    if (task.progress) {
      total += 1;
      current += task.progress;
    }
  }
  function getDisplay() {
    if (total === current) {
      // All events are finished or all events are have no progress value
      return <ProgressBar mode="loading" />
    } else {
      return <ProgressBar mode="progress" current={current} total={total} />
    }
  }
  return getDisplay()
}
