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
import { supabaseClient, useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

const ProfileButton = () => {
  const {
    data: userData,
    isLoading: userDataLoading,
    error: userDataErr,
  } = useQuery({ queryKey: ["user"], queryFn: getUser });
  const { sessionRef } = useAuth();
  const email = sessionRef.current?.user?.email;

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
              src={"hello"}
              alt={`${userData.username}'s profile`}
            ></AvatarImage>
            <AvatarFallback>
              {userData.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p>{userData.username}</p>
            {email && <p className="text-muted-foreground">{email}</p>}
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
