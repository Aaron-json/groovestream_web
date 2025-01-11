import { Media } from "../types/media";

type BaseTask = {
  name?: string;
  progress?: number;
  type: TaskType;
}

export enum TaskType {
  MediaTask
}

export type MediaTask = BaseTask & {
  type: TaskType.MediaTask;
  media?: Media;
}

export type Task = MediaTask;

export type TaskStore = {
  [id: string]: Task;
}
