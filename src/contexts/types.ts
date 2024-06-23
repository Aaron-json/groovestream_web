import { NullOrUndefined } from "../types/global";
import { AudioFile, Playlist } from "../types/media";

export type ContextProviderProps = {
  children: React.ReactNode;
};

// Used to update/get media from the same source.
export type MediaUpdater = (update: "next" | "prev") => AudioFile | undefined;

export type CurrentMedia =
  | {
    updaterFunc: MediaUpdater
    audiofile: AudioFile;
  }
  | NullOrUndefined;

