import React from "react";
import { ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { CustomAvatar, CustomAvatarSkeleton } from "./avatar";
import { signOut, useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { userOptions } from "@/hooks/user";
import { useQuery } from "@tanstack/react-query";

export default function SidebarUserCard() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Trigger />} />
      <DropdownMenuContent className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const Trigger = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { data: userData, isLoading: userLoading } = useQuery(userOptions());
  const { sessionRef } = useAuth();

  const url =
    sessionRef.current?.user.user_metadata?.avatar_url ||
    sessionRef.current?.user.user_metadata?.picture;
  const email = sessionRef.current?.user?.email;

  if (userLoading) {
    return <CustomAvatarSkeleton />;
  }

  return (
    <Button
      {...props}
      variant="ghost"
      className="w-full h-auto p-2 flex items-center justify-start gap-2"
    >
      <CustomAvatar
        username={userData?.username}
        picture_url={url}
        className="border h-8 w-8 shrink-0"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center text-left">
        <p className="truncate">{userData?.username}</p>
        {email && <p className="text-muted-foreground truncate">{email}</p>}
      </div>
      <div className="flex flex-col shrink-0 items-center justify-center text-muted-foreground">
        <ChevronUp className="h-3 w-3" />
        <ChevronDown className="h-3 w-3" />
      </div>
    </Button>
  );
};

Trigger.displayName = "Trigger";
