import {
  Avatar as ShadAvatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@groovestream/api/models";
import { cn } from "@/lib/utils";

type CustomAvatarProps = React.ComponentProps<typeof ShadAvatar> & {
  username?: User["username"];
  picture_url?: string;
};

function CustomAvatar({
  username,
  picture_url,
  className,
  ...props
}: CustomAvatarProps) {
  const hasPicture = !!picture_url;
  const hasUsername = !!username;

  return (
    <ShadAvatar
      className={cn("h-10 w-10 aspect-square rounded-full", className)}
      {...props}
    >
      {hasPicture && (
        <AvatarImage
          src={picture_url}
          alt={username ? `${username}'s avatar` : "User avatar"}
        />
      )}
      <AvatarFallback>
        {hasUsername ? username.charAt(0).toUpperCase() : null}
      </AvatarFallback>
    </ShadAvatar>
  );
}

function CustomAvatarSkeleton(props: React.ComponentProps<typeof Skeleton>) {
  return (
    <Skeleton
      className={cn("h-10 w-10 aspect-square rounded-full", props.className)}
      {...props}
    />
  );
}

export { CustomAvatar, CustomAvatarSkeleton };
