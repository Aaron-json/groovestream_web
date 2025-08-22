import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { ClipboardList, ListMusic } from "lucide-react";
import { TaskType, useTaskStore } from "@/lib/tasks";
import { DropdownMenuSeparator } from "../ui/dropdown-menu";
import { Progress } from "../ui/progress";
import { useQuery } from "@tanstack/react-query";
import { AudioUploadTaskPayload, getCloudTasks } from "@/api/requests/media";

export default function TasksDropdown() {
  const local_tasksObj = useTaskStore((state) => state.tasks);
  const local_tasks = Object.entries(local_tasksObj);

  if (local_tasks.length === 0) {
    return null;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 w-10">
          <ClipboardList />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-lg min-w-lg">
        <LocalTasks />
        <CloudTasks />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LocalTasks() {
  const local_tasksObj = useTaskStore((state) => state.tasks);
  const local_tasks = Object.entries(local_tasksObj);
  if (local_tasks.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenuLabel>
        <p className="text-center text-sm font-medium text-muted-foreground">
          Local Tasks
        </p>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {local_tasks.map(([id, task]) => {
        const icon =
          task.type === TaskType.MediaTask ? (
            <ListMusic size={16} />
          ) : (
            <ClipboardList size={16} />
          );
        const progress = task.progress;

        return (
          <DropdownMenuItem key={id} className="py-3 px-3">
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{icon}</span>
                <span className="truncate text-sm">{task.title}</span>
              </div>
              {progress && (
                <Progress
                  className="h-1.5 rounded-full"
                  value={progress.current}
                  max={progress.total}
                />
              )}
            </div>
          </DropdownMenuItem>
        );
      })}
    </>
  );
}

function CloudTasks() {
  const {
    data: tasks,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["cloud-tasks"],
    queryFn: getCloudTasks,
  });

  console.log(error, tasks);
  if (isLoading || isError || !tasks) {
    return null;
  } else if (tasks.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenuLabel>
        <p className="text-center text-sm font-medium text-muted-foreground">
          Cloud Tasks
        </p>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {tasks.map((task) => {
        let title;
        if (task.type === "AUDIO_UPLOAD") {
          const payload = task.payload as AudioUploadTaskPayload;
          title = `Uploading "${payload.filename}"`;
        }

        return (
          <DropdownMenuItem key={task.id} className="py-3 px-3 rounded">
            <div className="flex flex-col w-full gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  <ClipboardList size={16} />
                </span>
                <span className="truncate text-sm">{title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {task.status}
                </span>
              </div>
            </div>
          </DropdownMenuItem>
        );
      })}
    </>
  );
}
