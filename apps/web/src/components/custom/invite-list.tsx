import type { PlaylistInvite } from "@groovestream/api/models";
import InviteCard, { InviteCardSkeleton } from "./invite-card";

type InviteListProps = {
  invites: PlaylistInvite[];
  title?: string;
  onAccept: (invite: PlaylistInvite) => void;
  onDecline: (invite: PlaylistInvite) => void;
};

export default function InviteList({
  invites,
  title = "Invites",
  onAccept,
  onDecline,
}: InviteListProps) {
  return (
    <div className="flex flex-col w-full p-2">
      <h2 className="text-lg font-semibold text-primary mb-2">{title}</h2>
      <div className="flex flex-wrap gap-4">
        {invites.map((invite) => (
          <InviteCard
            key={invite.id}
            invite={invite}
            onAccept={onAccept}
            onDecline={onDecline}
          />
        ))}
      </div>
    </div>
  );
}

export function InviteListSkeleton() {
  return (
    <div className="flex flex-col w-full p-2">
      <div className="flex flex-wrap gap-4">
        <InviteCardSkeleton />
        <InviteCardSkeleton />
        <InviteCardSkeleton />
      </div>
    </div>
  );
}
