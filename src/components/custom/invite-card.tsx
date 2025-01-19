import { PlaylistInvite } from "@/types/invites";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Mail, X } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface PlaylistInviteProps {
  invite: PlaylistInvite;
  /** Override for the default onAccept */
  onAccept: (invite: PlaylistInvite) => void;
  /** Override for the default onDecline */
  onDecline: (invite: PlaylistInvite) => void;
}

const InviteCard = ({ invite, onAccept, onDecline }: PlaylistInviteProps) => {
  return (
    <Card className="max-w-prose">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <div>
            <Mail className="h-5 w-5 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {invite.from_username} invited you to
            </p>
            <p className="text-sm text-slate-200 truncate">
              {invite.playlist_name}
            </p>
          </div>
          <div className="flex gap-1 font-destructive">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => onDecline(invite)}
            >
              <X className="h-4 w-4 text-slate-300 text-destructive" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => onAccept(invite)}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function InviteCardSkeleton() {
  return (
    <Card className="max-w-prose">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 w-20">
            <Skeleton className="h-5 w-full" />
          </div>
          <div className="flex gap-1 font-destructive">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export default InviteCard;
