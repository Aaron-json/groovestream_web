import "./FriendRequests.css";
import { useQuery } from "@tanstack/react-query";
import {
  acceptFriendRequest,
  getFriendRequests,
  rejectFriendRequest,
} from "../../api/requests/social";
import { useState } from "react";
import { LoadingSpinnerDiv } from "..";

export default function FriendRequests() {
  const [page, setPage] = useState(1);
  const {
    data: friendRequests,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ["friendRequests", page],
    async () => await getFriendRequests(10 * (page - 1), 10)
  );

  function getDisplayComponent() {
    if (isLoading) {
      return <LoadingTile />;
    } else if (error) {
      return <ErrorTile />;
    } else if (friendRequests.length === 0) {
      return <NoFriendRequestsTile />;
    } else {
      return friendRequests.map((friendRequest: FriendRequest) => {
        return (
          <FriendRequestTile onChange={refetch} friendRequest={friendRequest} />
        );
      });
    }
  }

  return (
    <div className="friend-requests-comp">
      <div className="friend-requests-comp-header">
        <span>Friend Requests</span>
      </div>
      <div className="friend-requests-view">{getDisplayComponent()}</div>
    </div>
  );
}

function FriendRequestTile({ friendRequest, onChange }: any) {
  const [sendingRequest, setSendingRequest] = useState(false);
  async function acceptFriendReuqestHandler() {
    setSendingRequest(true);
    try {
      await acceptFriendRequest(friendRequest.senderID._id);
      await onChange();
    } catch (error) {
      console.log(error);
    }
    setSendingRequest(false);
  }

  async function rejectFriendRequestHandler() {
    setSendingRequest(true);
    try {
      await rejectFriendRequest(friendRequest.senderID._id);
      await onChange();
    } catch (error) {}
    setSendingRequest(false);
  }
  return (
    <div className="friend-request-tile">
      <span className="friend-request-sender">
        From: {friendRequest.senderID.email}
      </span>
      <div className="friend-request-action-btns">
        <button
          disabled={sendingRequest}
          className="friend-request-accept"
          onClick={acceptFriendReuqestHandler}
        >
          Accept
        </button>
        <button
          disabled={sendingRequest}
          className="friend-request-reject"
          onClick={rejectFriendRequestHandler}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

function LoadingTile() {
  return (
    <div className="empty-friend-request-tile">
      <LoadingSpinnerDiv spinnerSize={40} />
    </div>
  );
}

function NoFriendRequestsTile() {
  return (
    <div className="empty-friend-request-tile">
      You have no friend requests!
    </div>
  );
}
function ErrorTile() {
  return <div className="empty-friend-request-tile">Error occured</div>;
}
