import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";
import { useStore } from "@/store/store";
import { Button } from "../ui/button";
import { ClipboardList, ListMusic, Music } from "lucide-react";
import { TaskType } from "@/store/types";
import { DropdownMenuSeparator } from "../ui/dropdown-menu";

export default function TasksDropdown() {
  const tasksObj = useStore((state) => state.tasks);
  const tasks = Object.values(tasksObj);
  if (tasks.length === 0) {
    return null;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 w-10">
          <ClipboardList />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuLabel>
          <p className="text-center">Tasks</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tasks.map((task, idx) => {
          let taskIcon: React.ReactNode;
          if (task.type === TaskType.MediaTask) {
            taskIcon = <ListMusic />;
          } else {
            taskIcon = <Music />;
          }
          return (
            <DropdownMenuItem key={idx}>
              {taskIcon}
              <span>{task.title}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
