import "./Home.css";
import { MediaGrid, HorizontalScroll, Dialog } from "../../components";
import axiosClient from "../../api/axiosClient";
import { useContext, useEffect, useState } from "react";
import { profile_icon } from "../../default-icons";
import { authenticationContext } from "../../contexts/AuthenticationContext";
const homeCategories = [
  {
    title: "Top Songs on Spotify",
    endpoint: "songs/top",
    count: 15,
  },
  {
    title: "Top Artists on Spotify",
    endPoint: "artists/top",
    count: 15,
  },
];

export default function Home(props) {
  const { accessTokenRef, request, setAuthenticated } = useContext(
    authenticationContext
  );
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [user, setUser] = useState(null);
  async function fetchUserData() {
    try {
      const response = await request(async () => {
        return await axiosClient.get("/user", {
          headers: {
            Authorization: `Bearer ${accessTokenRef.current}`,
          },
          params: {
            fields: ["profilePicture", "firstName", "audioFiles", "playlists"],
          },
        });
      });
      setUser(response.data);
    } catch (err) {
      console.log(err);
    }
  }
  function displayProfileDialog() {
    <Dialog show={showProfileDialog}>This is this user's dialog</Dialog>;
  }
  useEffect(() => {
    fetchUserData();
  }, []);

  if (user === null) {
    return <div className="loading">Loading...</div>;
  }
  return (
    <section className="home-page">
      <div className="home-header">
        <h1 className="welcome-message">Hello {user && user.firstName}</h1>
        <div className="home-profile-div">
          <img src={profile_icon} alt="" className="home-profile-picture" />
          <button
            className="home-profile-button"
            onClick={() => setShowProfileDialog(!showProfileDialog)}
          >
            Profile
          </button>
        </div>
      </div>

      <hr className="home-header-bottom-line" />
      {user && (
        <MediaGrid
          items={getRecentlyPlayed(user.playlists, user.audioFiles)}
          title="Recently Played"
        />
      )}

      {user && (
        <HorizontalScroll
          items={getMostPlayedTracks(user.audioFiles)}
          title="Most Played Tracks"
        />
      )}

      {user && (
        <HorizontalScroll
          items={getMostPlayedPlaylists(user.playlists)}
          title="Most Played Playlists"
        />
      )}
    </section>
  );
}

function getRecentlyPlayed(playlists, audioFiles, limit = 6) {
  const processedMedia = audioFiles.concat(playlists).sort(
    // compares when the songs were last played and returns a new sorted array
    (a, b) =>
      (a.lastPlayed ? a.lastPlayed : 0) - (b.lastPlayed ? a.lastPlayed : 0)
  );

  return processedMedia.slice(-limit);
}

function getMostPlayedTracks(audioFiles, limit = 10) {
  const processedMedia = audioFiles.toSorted(
    (a, b) => a.playbackCount - b.playbackCount
  );

  return processedMedia.slice(-limit);
}

function getMostPlayedPlaylists(playlists, limit = 10) {
  const processedMedia = playlists.toSorted(
    (a, b) => a.playbackCount - b.playbackCount
  );
  return processedMedia.slice(-limit);
}

function getMostPlayedOnSpotify() {}

function getMostPlayedOnAppleMusic() {}
