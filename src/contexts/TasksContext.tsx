import { PropsWithChildren, createContext, useState } from "react";
export const tasksContext = createContext<TasksContextValue | undefined>(
  undefined
);
interface BaseTask {
  name?: string;
  type: TaskType;
  progress?: number;
}
export enum TaskType {
  MediaTask
}
export interface MediaTask extends BaseTask {
  type: TaskType.MediaTask;
  playlistID: number;
  playlistName?: string;
  audiofileID?: number;
  audiofileName?: string;
}
export type Task = MediaTask; // union of all supported task types
type TaskStore = {
  // id of a task. timestamp concantenated with another resource (eg. id of the playlist being modified) should be enough
  [id: string]: Task;
};
export type TasksContextValue = {
  addTask: (id: string, newTask: Task) => void;
  getTasks: (type?: TaskType) => Task[];
  removeTask: (taskId: string) => void;
  updateTask: (taskId: string, updatedTask: Task) => void;
  getTasksCount: () => number;
  getPlaylistTasks: (playlistID: number) => MediaTask[];
};
export function TasksContextProvider({ children }: PropsWithChildren) {
  const [tasks, setTasks] = useState<TaskStore>({});
  function getTasks(type?: TaskType) {
    if (type) {
      return Object.values(tasks).filter((task) => task.type === type);
    }
    return Object.values(tasks);
  }
  function getPlaylistTasks(playlistID: number) {
    return Object.values(tasks).filter(
      (task) => task.type === TaskType.MediaTask && task.playlistID === playlistID
    );
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
  function getTasksCount(type?: TaskType) {
    return getTasks(type).length;
  }

  return (
    <tasksContext.Provider
      value={{
        getTasks,
        addTask,
        removeTask,
        updateTask,
        getTasksCount,
        getPlaylistTasks,
      }}
    >
      {children}
    </tasksContext.Provider>
  );
}
