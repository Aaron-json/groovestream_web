import { create } from "zustand";
import { Audiofile } from "@/api/types/media";

export type MediaListSlice = {
  mediaLists: Record<string, Audiofile[]>;
  setMediaList: (key: string, list: Audiofile[]) => void;
  removeMediaList: (key: string) => void;
};

export const useMediaListStore = create<MediaListSlice>((set) => ({
  mediaLists: {},
  setMediaList: (key, list) => {
    set((prevState) => ({
      mediaLists: {
        ...prevState.mediaLists,
        [key]: list,
      },
    }));
  },
  removeMediaList: (key) => {
    set((prevState) => {
      const newLists = { ...prevState.mediaLists };
      delete newLists[key];
      return { mediaLists: newLists };
    });
  },
}));
