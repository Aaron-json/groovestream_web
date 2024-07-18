import { NullOrUndefined } from "../types/global";
import { AudioFile } from "../types/media";

export type MediaUpdateAction = "next" | "prev";
// Used to update/get media from the same source.
export type MediaUpdaterFunc = (update: MediaUpdateAction) => AudioFile | undefined;

export type CurrentMedia =
  | {
    index: number
    mediaStoreKey: string
    audiofile: AudioFile;
  }
