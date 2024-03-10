import { AudioFile, Playlist } from "../types/media";

export type NullorUndefined = null | undefined;

export type ContextProviderProps = {
  children: React.ReactNode;
};

export type CurrentMedia =
  | {
    index: number;
    queue: (AudioFile | Playlist)[];
  }
  | NullorUndefined;

export type mediaStateAction = {
  type: "next" | "previous" | "newMedia" | "unload";
  payload?: any | NullorUndefined;
};
