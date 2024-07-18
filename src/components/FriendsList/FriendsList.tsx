import "./FriendsList.css";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "..";
import {
  deleteFriend,
  getFriends,
  sendFriendRequest,
} from "../../api/requests/social";
import { validateUsername } from "../../validation/FormInput";
import LoadingSpinner from "../Spinner/Spinner";
import { delete_icon, profile_icon } from "../../assets/default-icons";
import { formatDistanceToNow } from "date-fns";
import { Friend } from "../../types/relations";
import { getProfilePicture } from "../../api/requests/user";
import { AxiosError } from "axios";
import { ResponseError } from "../../types/errors";
import { FormState } from "../../types/formstate";

export default function FriendsList() {
  const [showAddFriendsModal, setShowAddFriendsModal] = useState(false);
  const [page, setPage] = useState(1);
  const {
    data: friendsList,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["friends", page],
    queryFn: async () => getFriends(10 * (page - 1), 10),
  });

  function getDisplayComponent() {
    if (isLoading) {
      return <LoadingTile />;
    } else if (error) {
      return <ErrorTile />;
    } else if (friendsList?.length === 0) {
      return <NoFriendsTile />;
    } else {
      return (
        <div className="friends-view">
          {friendsList?.map((friendObj: Friend) =>
            <FriendTile
              key={friendObj.friendID}
              refetch={refetch}
              friendObj={friendObj}
            />
          )}
        </div>
      );
    }
  }
  return (
    <div className="friends-list-component">
      <div className="friends-list-header">
        <span>Friends</span>
        <button
          className="add-resource-button"
          onClick={() => setShowAddFriendsModal(true)}
        >
          Send Friend Request
        </button>
      </div>
      {getDisplayComponent()}
      {showAddFriendsModal && (
        <Modal
          show={showAddFriendsModal}
          onClose={() => setShowAddFriendsModal(false)}
          children={<AddFriendsComponent />}
        />
      )}
    </div>
  );
}
interface FriendTileProps {
  friendObj: Friend;
  refetch: () => any;
}
function FriendTile({ friendObj, refetch }: FriendTileProps) {
  console.log(friendObj.friendID)
  const {
    data: friendPhoto,
    error,
    isLoading: loadingPhoto,
  } = useQuery({
    queryKey: ["friendPhoto", friendObj.friendshipID],
    queryFn: async () => getProfilePicture(friendObj.friendID),
  });
  function getDisplayPhoto() {
    if (loadingPhoto) {
      return <LoadingSpinner size={40} />;
    } else if (error || !friendPhoto) {
      return <img className="friend-tile-pfp" src={profile_icon} alt="" />;
    } else {
      const { data, encoding, mimeType } = friendPhoto;
      return (
        <img
          className="friend-tile-pfp"
          src={`data:${mimeType};${encoding},${data}`}
          alt="Error"
        />
      );
    }
  }

  async function deleteFriendHandler() {
    try {
      await deleteFriend(friendObj.friendshipID);
      await refetch();
    } catch (error) { }
  }
  return (
    <div className="friend-tile tile">
      <div className="friend-tile-pfp-div">{getDisplayPhoto()}</div>

      <div className="friend-tile-info-div">
        <span className="friend-tile-email">{`${friendObj.username}`}</span>
        <span className="friend-tile-friend-since">{`Friends for ${formatDistanceToNow(
          new Date(friendObj.since)
        )}`}</span>
      </div>
      <div className="friend-tile-options-div">
        <div className="friend-tile-action-btns">
          <button
            onClick={deleteFriendHandler}
            className="friend-tile-delete-btn"
          >
            <img src={delete_icon} alt="Error" />
          </button>
        </div>
      </div>
    </div>
  );
}
function NoFriendsTile() {
  return (
    <div className="empty-friend-tile tile">
      <span>Looks like you haven't added any friends yet!</span>
    </div>
  );
}

function LoadingTile() {
  return (
    <div className="empty-friend-tile tile">
      <LoadingSpinner size={45} />
    </div>
  );
}
function ErrorTile() {
  return <div className="empty-friend-tile tile">Error Occured</div>;
}
function AddFriendsComponent() {
  const [formState, setFormState] = useState<FormState>({ state: "input" });
  const [username, setUsername] = useState("");
  async function sendFriendRequestHandler(
    e: React.MouseEvent<HTMLButtonElement>
  ) {
    setFormState({ state: "loading" });
    e.preventDefault();
    const validationErr = validateUsername(username);
    if (validationErr) {
      setFormState({ state: "error", message: "Invalid username" });
      return;
    }
    try {
      await sendFriendRequest(username);
      setFormState({ state: "submitted", message: "Request sent!" });
    } catch (error: any) {
      let message;
      switch (error.response?.data.code) {
        case "INV01":
          message = "Could not find user";
          break;
        case "INV02":
          message = "Cannot send yourself a friend request";
          break;
        case "INV03":
          message = "User is already your friend";
          break;
        case "INV04":
          message = "You have already sent this user a friend request";
          break;
        default:
          message = "Request failed";
          break;
      }
      setFormState({ state: "error", message });
    }
  }
  return (
    <form className="add-friends-comp">
      <div className="add-friends-comp-header">
        <h1>Add A Friend</h1>
      </div>
      {(formState.state === "error" || formState.state === "submitted") && (
        <h3 className="form-err-message">{formState.message}</h3>
      )}
      <label className="add-friend-comp-email-label">
        Enter their username
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value.trim())}
          className="form-input"
          type="text"
          placeholder="Enter friends's username"
        />
      </label>
      <button
        disabled={formState.state === "loading"}
        className="form-button"
        onClick={sendFriendRequestHandler}
      >
        {formState.state === "loading" ? "Loading..." : "Add"}
      </button>
    </form>
  );
}
