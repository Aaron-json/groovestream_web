import "./UserProfilePage.css";
import { authenticationContext } from "../../contexts/AuthenticationContext";
import { useContext, useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { profile_icon } from "../../default-icons";
import moment from "moment/moment";
export default function UserProfilePage() {
  const [user, setUser] = useState();
  const [profileChanges, setProfileChanges] = useState({});
  const { accessTokenRef, request, logout } = useContext(authenticationContext);
  useEffect(() => {
    fetchUserData();
  }, []);

  async function fetchUserData() {
    try {
      const response = await request(async () => {
        return await axiosClient.get("/user", {
          headers: {
            Authorization: `Bearer ${accessTokenRef.current}`,
          },
          params: {
            fields: [
              "profilePicture",
              "firstName",
              "lastName",
              "audioFiles",
              "playlists",
              "dateCreated",
              "email",
            ],
          },
        });
      });
      setUser(response.data);
    } catch (err) {
      console.log(err);
    }
  }

  function getProfilePicture() {
    if (user.profilePicture) {
      return `data:image/png:base64,${user.profilePicture}`;
    } else {
      return profile_icon;
    }
  }

  if (!user) return null;
  return (
    <section className="user-profile-page">
      <div className="user-profile-page-profile-picture-div">
        <img
          className="user-profile-page-profile-picture"
          src={getProfilePicture()}
          alt=""
        />
      </div>
      <div className="user-profile-page-name-div">
        <label className="user-profile-page-label">
          First Name
          <input
            className="user-profile-page-name-input form-input"
            placeholder={user.firstName}
            type="text"
          />
        </label>
        <label className="user-profile-page-label">
          Last Name
          <input
            className="user-profile-page-name-input form-input"
            placeholder={user.lastName}
            type="text"
          />
        </label>
      </div>
      <label className="user-profile-page-label">
        Email
        <input className="form-input" placeholder={user.email} type="email" />
      </label>
      <label className="user-profile-page-label">
        Birthday
        <input className="form-input" type="date" />
      </label>
      <label className="user-profile-page-label">
        Date Joined: {moment(user.dateCreated).format()}
      </label>
      <button
        onClick={() => logout()}
        className="form-button user-profile-page-logout-btn"
      >
        Logout
      </button>
    </section>
  );
}
