import { create } from "zustand";
import { Audiofile } from "@/api/types/media";
import { Task } from "./types";

type Store = {
  // MEDIA LISTS
  mediaLists: Record<string, Audiofile[]>;
  setMediaList: (key: string, list: Audiofile[]) => void;
  removeMediaList: (key: string) => void;

  // TASKS
  tasks: Record<string, Task>;
  setTask: (id: string, newTask: Task) => void;
  removeTask: (taskId: string) => void;
};

export const useStore = create<Store>((set) => ({
  mediaLists: {},
  setMediaList: (key: string, list: Audiofile[]) => {
    set((prevState) => ({
      mediaLists: {
        ...prevState.mediaLists,
        [key]: list,
      },
    }));
  },
  removeMediaList: (key: string) => {
    set((prevState) => ({
      ...prevState,
      [key]: undefined,
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
}));
