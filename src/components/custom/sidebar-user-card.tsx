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
import { Button } from "@/components/ui/button";

export default function SidebarUserCard() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Trigger />} />
      <DropdownMenuContent className="w-52">
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// NOTE: check how it looks in the end
const Trigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>((props, ref) => {
  const { data: userData } = useQuery({ queryKey: ["user"], queryFn: getUser });
  const { sessionRef } = useAuth();

  const url =
    sessionRef.current?.user.user_metadata?.avatar_url ||
    sessionRef.current?.user.user_metadata?.picture;
  const email = sessionRef.current?.user?.email;

  return (
    <Button
      ref={ref}
      {...props}
      variant="ghost"
      className="w-full  h-auto p-2 flex items-center justify-start gap-2"
    >
      <CustomAvatar
        user={userData}
        picture_url={url}
        className="border rounded-full aspect-square h-8 w-8 shrink-0"
      />
      <div className="flex-1 flex flex-col justify-center truncate">
        <p className="truncate">{userData?.username}</p>
        {email && <p className="text-muted-foreground">{email}</p>}
      </div>
      <div className="flex flex-col flex-shrink-0 items-center justify-center">
        <ChevronUp className="h-3 w-3" />
        <ChevronDown className="h-3 w-3" />
      </div>
    </Button>
  );
});

Trigger.displayName = "Trigger";
