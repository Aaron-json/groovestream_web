import { PlaylistInvite } from "@/types/invites";
import InviteCard, { InviteCardSkeleton } from "./invite-card";

type InviteListProps = {
  invites: PlaylistInvite[];
  title?: string;
  refetch?: () => void;
  onAccept: (invite: PlaylistInvite) => void;
  onDecline: (invite: PlaylistInvite) => void;
};

export default function InviteList(props: InviteListProps) {
  const title = props.title || "Invites";
  return (
    <div className="flex flex-col w-full p-2">
      <h2 className="text-lg font-semibold text-primary mb-2">{title}</h2>
      <div className="flex flex-wrap gap-4">
        {props.invites.map((invite) => (
          <InviteCard
            key={invite.id}
            invite={invite}
            onAccept={props.onAccept}
            onDecline={props.onDecline}
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
