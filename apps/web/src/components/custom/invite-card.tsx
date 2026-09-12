import { useState } from "react";
import { Check, Eye, ListMusic, LoaderCircle, Pencil, X } from "lucide-react";

import type { PlaylistInvite } from "@groovestream/api/models";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface PlaylistInviteProps {
  invite: PlaylistInvite;
  onAccept: (invite: PlaylistInvite) => Promise<void>;
  onDecline: (invite: PlaylistInvite) => Promise<void>;
}

type PendingAction = "accept" | "decline";

export default function InviteCard({
  invite,
  onAccept,
  onDecline,
}: PlaylistInviteProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>();
  const canEdit = invite.access_level === "write";

  async function runAction(action: PendingAction) {
    setPendingAction(action);
    try {
      await (action === "accept" ? onAccept(invite) : onDecline(invite));
    } finally {
      setPendingAction(undefined);
    }
  }

  return (
    <article className="flex min-w-0 flex-col rounded-lg border bg-card p-3.5 shadow-xs">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
          <ListMusic className="size-4" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className="truncate text-sm font-medium text-foreground"
            title={invite.playlist_name}
          >
            {invite.playlist_name}
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Invited by{" "}
            <span className="font-medium text-foreground">
              {invite.from_username}
            </span>
            <span className="mx-1.5" aria-hidden="true">
              ·
            </span>
            {formatInviteDate(invite.created_at)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {canEdit ? (
            <Pencil className="size-3.5" aria-hidden="true" />
          ) : (
            <Eye className="size-3.5" aria-hidden="true" />
          )}
          {canEdit ? "Can edit" : "Can view"}
        </span>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            disabled={pendingAction !== undefined}
            onClick={() => void runAction("decline")}
          >
            {pendingAction === "decline" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <X />
            )}
            Decline
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pendingAction !== undefined}
            onClick={() => void runAction("accept")}
          >
            {pendingAction === "accept" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Check />
            )}
            Accept
          </Button>
        </div>
      </div>
    </article>
  );
}

export function InviteCardSkeleton() {
  return (
    <div className="flex min-w-0 flex-col rounded-lg border bg-card p-3.5">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-1.5 py-0.5">
          <Skeleton className="h-4 w-36 max-w-full" />
          <Skeleton className="h-3 w-44 max-w-full" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
        <Skeleton className="h-4 w-16" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function formatInviteDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
