import { create } from "zustand";
import { Media } from "@/api/types/media";

export type TaskSlice = {
  tasks: Record<string, Task>;
  setTask: (id: string, newTask: Task) => void;
  removeTask: (taskId: string) => void;
};

export const useTaskStore = create<TaskSlice>((set) => ({
  tasks: {},
  setTask: (id, newTask) => {
    set((prevState) => ({
      tasks: { ...prevState.tasks, [id]: newTask },
    }));
  },
  removeTask: (taskId) => {
    set((prevState) => {
      delete prevState.tasks[taskId];
      return { tasks: { ...prevState.tasks } };
    });
  },
}));

export enum TaskType {
  MediaTask = "MEDIA",
}

type BaseTask = {
  title: string;
  type: TaskType;
};

export type MediaProgress = {
  current: number;
  total: number;
  unit: string;
};
export type MediaTask = BaseTask & {
  type: TaskType.MediaTask;
  media?: Media;
  progress?: MediaProgress;
};

export function NewMediaTask(
  title: string,
  media?: Media,
  progress?: MediaProgress,
): MediaTask {
  return {
    title,
    type: TaskType.MediaTask,
    media,
    progress,
  };
}

export type Task = MediaTask;
