import { create } from "zustand";
import { Audiofile } from "@/api/types/media";
import { Task, TaskStore, TaskType } from "./types";

type Store = {
  // MEDIA LISTS
  mediaLists: {
    [key: string]: Audiofile[];
  };
  setMediaList: (key: string, list: Audiofile[]) => void;

  // TASKS
  tasks: TaskStore;
  setTask: (id: string, newTask: Task) => void;
  removeTask: (taskId: string) => void;
  getTask: (taskId: string) => Task | undefined;
  getTasks: (type?: TaskType) => Task[];
};

export const useStore = create<Store>((set, get) => ({
  mediaLists: {},
  setMediaList: (key: string, list: Audiofile[]) => {
    set((prevState) => ({
      mediaLists: {
        ...prevState.mediaLists,
        [key]: list,
      },
    }));
  },
  tasks: {},
  setTask: (id: string, newTask: Task) => {
    set((prevState) => ({
      tasks: { ...prevState.tasks, [id]: newTask },
    }));
  },
  removeTask: (taskId: string) => {
    set((prevState) => {
      delete prevState.tasks[taskId];
      return { tasks: { ...prevState.tasks } };
    });
  },
  getTask: (taskId: string) => {
    return get().tasks[taskId];
  },
  getTasks: (type?: TaskType) => {
    if (type) {
      return Object.values(get().tasks).filter((value) => value.type === type);
    }
    return Object.values(get().tasks);
  },
}));
