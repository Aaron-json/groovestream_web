import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Avatar as ShadAvatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/api/requests/user";
import { signOut, useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@/api/types/user";

const AvatarDropdown = () => {
  const {
    data: userData,
    isLoading: userDataLoading,
    error: userDataErr,
  } = useQuery({ queryKey: ["user"], queryFn: getUser });
  const { sessionRef } = useAuth();
  const email = sessionRef.current?.user?.email;

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
          <ShadAvatar className="h-10 w-10 border">
            <AvatarImage
              src={"hello"}
              alt={`${userData.username}'s profile`}
            ></AvatarImage>
            <AvatarFallback>
              {userData.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </ShadAvatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>
          <div className="flex flex-col leading-tight">
            <p>{userData.username}</p>
            {email && <p className="text-muted-foreground">{email}</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type CustomAvatarProps = {
  user: User | undefined;
  email?: string;
  picture_url?: string;
};

export function CustomAvatar(
  props: CustomAvatarProps & {
    className: React.ComponentPropsWithoutRef<typeof ShadAvatar>["className"];
  },
) {
  if (!props.user) {
    return <Skeleton className="animate-none h-10 w-10 rounded-full" />;
  }
  return (
    <ShadAvatar className={props.className}>
      <AvatarImage
        src={props.picture_url}
        alt={`${props.user.username}'s profile`}
      ></AvatarImage>
      <AvatarFallback>
        {props.user.username.charAt(0).toUpperCase()}
      </AvatarFallback>
    </ShadAvatar>
  );
}

export default AvatarDropdown;
