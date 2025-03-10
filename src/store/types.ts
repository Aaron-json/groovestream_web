import { Media } from "@/api/types/media";

type BaseTask = {
  name?: string;
  type: TaskType;
};

export enum TaskType {
  MediaTask,
}

export type MediaTask = BaseTask & {
  type: TaskType.MediaTask;
  media?: Media;
};

export type Task = MediaTask;

export type TaskStore = {
  [id: string]: Task;
};
