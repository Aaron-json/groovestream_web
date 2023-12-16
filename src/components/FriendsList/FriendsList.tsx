import "./FriendsList.css";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinnerDiv, Modal } from "..";
import {
  deleteFriend,
  getFriendProfilePicture,
  getFriends,
  sendFriendRequest,
} from "../../api/requests/social";
import { validateEmail } from "../../api/validation/FormInput";
import LoadingSpinner from "../Spinner/Spinner";
import { delete_icon, profile_icon } from "../../assets/default-icons";
import { formatDistanceToNow } from "date-fns";

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
    } else if (friendsList.length === 0) {
      return <NoFriendsTile />;
    } else {
      return (
        <div className="friends-view">
          {friendsList.map((friendObj: Friend) => {
            return (
              <FriendTile
                key={friendObj.friendID._id}
                refreshData={refetch}
                friendObj={friendObj}
              />
            );
          })}
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

function FriendTile({ friendObj, refreshData }: any) {
  const {
    data: friendPhoto,
    error,
    isLoading: loadingPhoto,
  } = useQuery({
    queryKey: ["friendPhoto", friendObj.friendID._id],
    queryFn: async () => getFriendProfilePicture(friendObj.friendID._id),
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
      await deleteFriend(friendObj.friendID._id);
      await refreshData();
    } catch (error) {}
  }
  return (
    <div className="friend-tile">
      <div className="friend-tile-pfp-div">{getDisplayPhoto()}</div>

      <div className="friend-tile-info-div">
        <span className="friend-tile-name">{`${friendObj.friendID.firstName} ${friendObj.friendID.lastName}`}</span>
        <span className="friend-tile-email">{`${friendObj.friendID.email}`}</span>
        <span className="friend-tile-friend-since">{`Friends for ${formatDistanceToNow(
          new Date(friendObj.createdAt)
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
    <div className="empty-friend-tile">
      <span>Looks like you haven't added any friends yet!</span>
    </div>
  );
}

function LoadingTile() {
  return (
    <div className="empty-friend-tile">
      <LoadingSpinner size={45} />
    </div>
  );
}
function ErrorTile() {
  return <div className="empty-friend-tile">Error Occured</div>;
}
function AddFriendsComponent() {
  const [email, setEmail] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  async function sendFriendRequestHandler(
    e: React.MouseEvent<HTMLButtonElement>
  ) {
    setSendingRequest(true);
    e.preventDefault();
    const ifValidEmail = validateEmail(email);
    if (ifValidEmail) {
      try {
        await sendFriendRequest(email);
      } catch (error) {
        console.log(error);
      }
    } else {
      setErrorMessage("Invalid Email");
    }
    setSendingRequest(false);
  }
  return (
    <div className="add-friends-comp">
      <div className="add-friends-comp-header">
        <h1>Add A Friend</h1>
      </div>
      <label className="add-friend-comp-email-label">
        Enter an email address
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
          type="text"
          placeholder="Enter friends's username or email"
        />
      </label>
      <button
        disabled={sendingRequest}
        className="form-button"
        onClick={sendFriendRequestHandler}
      >
        {sendingRequest ? "Loading..." : "Add"}
      </button>
    </div>
  );
}
