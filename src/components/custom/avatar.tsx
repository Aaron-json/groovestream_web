import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/api/requests/user";
import { supabaseClient } from "@/auth/client";
import { Skeleton } from "@/components/ui/skeleton";

const ProfileButton = ({ avatarUrl = "/api/placeholder/40/40" }) => {
  const {
    data: userData,
    isLoading: userDataLoading,
    error: userDataErr,
  } = useQuery({ queryKey: ["user"], queryFn: getUser });

  async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      throw error;
    }
    location.reload();
  }

  if (userDataLoading || !userData) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }
  if (userDataErr) {
    return <div className="h-10 w-10 rounded-full" />;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={avatarUrl}
              alt={`${userData.username}'s profile`}
            />
            <AvatarFallback>
              {userData.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm">{userData.username}</p>
            <p className="text-xs text-muted-foreground">{userData.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileButton;
