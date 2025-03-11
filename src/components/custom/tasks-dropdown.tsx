import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { useStore } from "@/store/store";
import { Button } from "../ui/button";
import { ClipboardList } from "lucide-react";

export default function TasksDropdown() {
  const tasksObj = useStore((state) => state.tasks);
  const tasks = Object.values(tasksObj)
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
        {tasks.map((task) => (
          <DropdownMenuItem>
            <span>{task.title}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
