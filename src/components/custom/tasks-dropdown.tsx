import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ClipboardList, ListMusic, RefreshCw } from "lucide-react";
import { TaskType, useTaskStore } from "@/lib/tasks";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { AudioUploadTaskPayload, getCloudTasks } from "@/api/requests/media";

export default function TasksDropdown() {
  const { data: cloudTasks, refetch: refetchCloudTasks } = useQuery({
    queryKey: ["cloud-tasks"],
    queryFn: getCloudTasks,
  });

  const localTasksObj = useTaskStore((state) => state.tasks);
  const localTasks = Object.entries(localTasksObj);

  const hasCloudTasks = cloudTasks && cloudTasks.length > 0;
  const hasLocalTasks = localTasks.length > 0;
  const hasAnyTasks = hasLocalTasks || hasCloudTasks;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ClipboardList className="h-5 w-5" />
          {hasAnyTasks && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <DropdownMenuLabel className="p-0">Tasks</DropdownMenuLabel>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              refetchCloudTasks();
            }}
          >
            <RefreshCw />
          </Button>
        </div>

        <DropdownMenuSeparator />

        {!hasAnyTasks ? (
          <div className="px-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">No active tasks</p>
          </div>
        ) : (
          <>
            <LocalTasks tasks={localTasks} />
            <CloudTasks tasks={cloudTasks} />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface LocalTasksProps {
  tasks: Array<[string, any]>;
}

function LocalTasks({ tasks }: LocalTasksProps) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <div className="px-2 py-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase">
          Local Tasks
        </p>
      </div>

      {tasks.map(([id, task]) => {
        const Icon =
          task.type === TaskType.MediaTask ? ListMusic : ClipboardList;

        return (
          <DropdownMenuItem
            key={id}
            className="px-3 py-2.5 cursor-default focus:text-accent-foreground"
          >
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 opacity-70" />
                <span className="truncate text-sm">{task.title}</span>
              </div>
              {task.progress && (
                <div className="space-y-1">
                  <Progress
                    className="h-1.5"
                    value={task.progress.current}
                    max={task.progress.total}
                  />
                  <p className="text-xs opacity-70">
                    {task.progress.current} / {task.progress.total}
                  </p>
                </div>
              )}
            </div>
          </DropdownMenuItem>
        );
      })}
    </div>
  );
}

interface CloudTasksProps {
  tasks?: Array<{
    id: string;
    type: string;
    status: string;
    payload: any;
  }>;
}

function CloudTasks({ tasks }: CloudTasksProps) {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenuSeparator />
      <div className="space-y-1">
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Cloud Tasks
          </p>
        </div>

        {tasks.map((task) => {
          let title = "Processing...";

          if (task.type === "AUDIO_UPLOAD") {
            const payload = task.payload as AudioUploadTaskPayload;
            title = payload.filename;
          }

          return (
            <DropdownMenuItem
              key={task.id}
              className="px-3 py-2.5 cursor-default focus:text-accent-foreground"
            >
              <div className="flex flex-col w-full gap-1">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="truncate text-sm flex-1">{title}</span>
                  <span className="text-xs capitalize opacity-70">
                    {task.status.toLowerCase()}
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </div>
    </>
  );
}
