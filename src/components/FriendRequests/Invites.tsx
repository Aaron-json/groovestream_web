import "./Invites.css";
import { useQuery } from "@tanstack/react-query";
import {
  acceptFriendRequest,
  getFriendRequests,
  rejectFriendRequest,
} from "../../api/requests/social";
import { useState } from "react";
import { LoadingSpinnerDiv } from "..";
import {
  acceptPlaylistInvite,
  rejectPlaylistInvite,
} from "../../api/requests/media";
import { formatDistanceToNow } from "date-fns";
type InvitesProps = {
  data: (FriendRequest | PlaylistInvite)[];
  type: "friend-requests" | "playlist-invites";
  title: string;
  refreshData: () => any;
  error: boolean;
  loading: boolean;
};
export default function Invites({
  data,
  type,
  title,
  refreshData,
  error,
  loading,
}: InvitesProps) {
  function getDisplayComponent() {
    if (error) {
      return <ErrorTile />;
    } else if (loading) {
      return <LoadingTile />;
    } else if (data.length === 0) {
      return <NoInviteTile type={type} />;
    } else {
      return data.map((invite) => {
        let key;
        if (type === "friend-requests") {
          key = invite.senderID._id;
        } else if (type === "playlist-invites") {
          // the same sender can invite you to multiple playlists but
          // you can only be invited to the same playlist once
          // use playlist id as key if type is playlist invite
          key = (invite as PlaylistInvite).playlistID._id;
        }
        return (
          <InviteTile
            key={key}
            onChange={refreshData}
            invite={invite}
            type={type}
          />
        );
      });
    }
  }

  return (
    <div className="invites">
      <div className="invites-header">
        <span>{title}</span>
      </div>
      <div className="invites-view">{getDisplayComponent()}</div>
    </div>
  );
}
type InviteTileProps = {
  invite: FriendRequest | PlaylistInvite;
  onChange: () => any;
  type: InvitesProps["type"];
};
function InviteTile({ invite, onChange, type }: InviteTileProps) {
  const [formState, setFormState] = useState<FormState>({ state: "input" });

  async function acceptInvite() {
    setFormState({ state: "loading" });
    try {
      if (type === "friend-requests") {
        await acceptFriendRequest(invite.senderID._id);
      } else if (type === "playlist-invites") {
        await acceptPlaylistInvite(
          invite.senderID._id,
          (invite as PlaylistInvite).playlistID._id
        );
      }
      setFormState({ state: "submitted", message: "Invite sent successfully" });
      await onChange(); // updates the invites and gets new ones
    } catch (error) {
      setFormState({ state: "error", message: "Error sending request" });
    }
  }

  async function rejectInvite() {
    setFormState({ state: "loading" });
    try {
      if (type === "friend-requests") {
        await rejectFriendRequest(invite.senderID._id);
      } else if (type === "playlist-invites") {
        await rejectPlaylistInvite(
          invite.senderID._id,
          (invite as PlaylistInvite).playlistID._id
        );
      }
      setFormState({ state: "submitted", message: "Invite sent successfully" });

      await onChange();
    } catch (error) {
      setFormState({ state: "error", message: "Error sending request" });
    }
  }
  return (
    <div className="invite-tile">
      <span className="invite-sender">From: {invite.senderID.email}</span>
      <span className="invite-date">
        Sent{" "}
        {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}
      </span>
      {type === "playlist-invites" && (
        <span className="invite-name">
          Playlist Name: {(invite as PlaylistInvite).playlistID.name}
        </span>
      )}
      <div className="invite-action-btns">
        <button
          disabled={formState.state === "loading"}
          className="invite-accept"
          onClick={acceptInvite}
        >
          Accept
        </button>
        <button
          disabled={formState.state === "loading"}
          className="invite-reject"
          onClick={rejectInvite}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

function LoadingTile() {
  return (
    <div className="empty-invite-tile">
      <LoadingSpinnerDiv spinnerSize={40} />
    </div>
  );
}
type NoInviteTileProps = {
  type: InvitesProps["type"];
};
function NoInviteTile({ type }: NoInviteTileProps) {
  return (
    <div className="empty-invite-tile">
      {type === "friend-requests" && "You have no friend requests!"}
      {type === "playlist-invites" && "You have no playlist invites!"}
    </div>
  );
}
function ErrorTile() {
  return <div className="empty-invite-tile">Error occured</div>;
}
