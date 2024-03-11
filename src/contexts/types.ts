import { NullOrUndefined } from "../types/global";
import { AudioFile, Playlist } from "../types/media";


export type ContextProviderProps = {
  children: React.ReactNode;
};

export type CurrentMedia =
  | {
    index: number;
    queue: (AudioFile | Playlist)[];
  }
  | NullOrUndefined;

export type mediaStateAction = {
  type: "next" | "previous" | "newMedia" | "unload";
  payload?: any | NullOrUndefined;
};
