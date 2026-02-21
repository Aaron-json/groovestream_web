import SidebarToggle from "./sidebar-toggle";
import TasksDropdown from "./tasks-dropdown";
import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/api/requests/user";
import { signOut, useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { CustomAvatar, CustomAvatarSkeleton } from "./avatar";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const AvatarDropdown = () => {
  const { data: userData, isLoading: userDataLoading } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

  const { sessionRef } = useAuth();

  const url =
    sessionRef.current?.user.user_metadata?.avatar_url ||
    sessionRef.current?.user.user_metadata?.picture;
  const email = sessionRef.current?.user?.email;

  if (userDataLoading) {
    return <CustomAvatarSkeleton />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded full">
            <CustomAvatar username={userData?.username} picture_url={url} />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {!email && !userData ? (
              <p className="text-sm text-muted-foreground">
                Failed to load user data
              </p>
            ) : (
              <div className="flex flex-col leading-tight">
                <p>{userData?.username}</p>
                {email && <p className="text-muted-foreground">{email}</p>}
              </div>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function TopBar() {
  return (
    <header className="sticky top-0 z-50 w-full h-12 flex items-center justify-between px-2 bg-background/60 backdrop-blur-sm border-b">
      <div className="h-full flex items-center">
        <SidebarToggle />
      </div>
      <div className="h-full flex items-center gap-2">
        <TasksDropdown />
        <AvatarDropdown />
      </div>
    </header>
  );
}
