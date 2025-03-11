import { Media } from "@/api/types/media";

type BaseTask = {
  title: string;
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
