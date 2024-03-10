import { TasksContextValue } from "../../contexts/TasksContext"

export interface TaskConfig {
  addTask: TasksContextValue["addTask"]
  updateTask: TasksContextValue["updateTask"]
  removeTask: TasksContextValue["removeTask"]
}