import "./UserProfilePage.css";
import { authenticationContext } from "../../contexts/AuthenticationContext";
import { useContext, useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { profile_icon } from "../../default-icons";
export default function UserProfilePage() {
  const [user, setUser] = useState();
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
      <button onClick={() => logout()} className="user-profile-page-logout-btn">
        Logout
      </button>
    </section>
  );
}
