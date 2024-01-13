import { createContext, useState } from "react";
export const tasksContext = createContext<TasksContextValue | undefined>(
  undefined
);
interface BaseTask {
  name?: string;
  // id of the resource this task was created in. Eg. playlistID If the task was created in a playlist
  // useful to show task progress on the playlist page
  originID?: string;
}
export interface ProgressTask extends BaseTask {
  mode: "progress";
  progress: number; // decimal between 0 and 1
}
export interface LoadingTask extends BaseTask {
  mode: "loading";
}
export type Task = ProgressTask | LoadingTask;
type Tasks = {
  // id of a task. timestamp concantenated with another resource (eg. id of the playlist being modified) should be enough
  [id: string]: Task;
};
type TasksContextValue = {
  addTask: (id: string, newTask: Task) => void;
  getTasks: () => Task[];
  removeTask: (taskId: string) => void;
  updateTask: (taskId: string, updatedTask: Task) => void;
  getTasksCount: () => number;
};
export function TasksContextProvider({ children }: ContextProviderProps) {
  const [tasks, setTasks] = useState<Tasks>({});
  function getTasks() {
    return Object.values(tasks);
  }
  function addTask(id: string, newTask: Task) {
    setTasks({ ...tasks, [id]: newTask });
  }
  function removeTask(id: string) {
    delete tasks[id];
    setTasks({ ...tasks });
  }

  function updateTask(id: string, updatedTask: Task) {
    setTasks({ ...tasks, [id]: updatedTask });
  }
  function getTasksCount() {
    return Object.keys(tasks).length;
  }
  function getOriginTasks(originID: string) {
    return Object.values(tasks).filter((value) => value.originID === originID);
  }
  return (
    <tasksContext.Provider
      value={{
        getTasks,
        addTask,
        removeTask,
        updateTask,
        getTasksCount,
      }}
    >
      {children}
    </tasksContext.Provider>
  );
}
