import type { PlaylistInvite } from "@groovestream/api/models";

import InviteCard, { InviteCardSkeleton } from "./invite-card";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type InviteListProps = {
  invites: PlaylistInvite[];
  hasMore?: boolean;
  onAccept: (invite: PlaylistInvite) => Promise<void>;
  onDecline: (invite: PlaylistInvite) => Promise<void>;
};

export default function InviteList({
  invites,
  hasMore = false,
  onAccept,
  onDecline,
}: InviteListProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Playlist invitations</CardTitle>
        <CardDescription>
          Review playlists that other people have shared with you.
        </CardDescription>
        <CardAction>
          <span className="text-xs font-medium text-muted-foreground">
            {invites.length}
            {hasMore ? "+" : ""} pending
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="@container bg-muted/20 p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-3 @[680px]:grid-cols-2">
          {invites.map((invite) => (
            <InviteCard
              key={invite.id}
              invite={invite}
              onAccept={onAccept}
              onDecline={onDecline}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function InviteListSkeleton() {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <Skeleton className="h-5 w-36" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-72 max-w-full" />
        </CardDescription>
      </CardHeader>
      <CardContent className="@container bg-muted/20 p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-3 @[680px]:grid-cols-2">
          <InviteCardSkeleton />
          <InviteCardSkeleton />
        </div>
      </CardContent>
    </Card>
  );
}
