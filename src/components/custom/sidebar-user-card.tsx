import React from "react";
import { ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { CustomAvatar } from "./avatar";
import { signOut, useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/api/requests/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SidebarUserCard() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Trigger />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52">
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const Trigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => {
  const { data: userData } = useQuery({ queryKey: ["user"], queryFn: getUser });
  const { sessionRef } = useAuth();

  const url =
    sessionRef.current?.user.user_metadata?.avatar_url ||
    sessionRef.current?.user.user_metadata?.picture;
  const email = sessionRef.current?.user?.email;

  return (
    <div
      ref={ref}
      {...props}
      className="flex p-2 gap-2 text-sm leading-none items-center cursor-pointer hover:bg-secondary rounded-lg"
    >
      <CustomAvatar
        user={userData}
        picture_url={url}
        className="border rounded-full aspect-square h-5/5"
      />
      <div className="flex-1 flex flex-col justify-center truncate">
        <p className="truncate">{userData?.username}</p>
        {email && <p className="text-muted-foreground">{email}</p>}
      </div>
      <div className="flex flex-col flex-shrink-0 items-center justify-center">
        <ChevronUp className="h-3 w-3" />
        <ChevronDown className="h-3 w-3" />
      </div>
    </div>
  );
});

Trigger.displayName = "Trigger";
