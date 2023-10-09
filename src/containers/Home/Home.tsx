import "./Home.css";
import { MediaGrid, HorizontalScroll, Modal } from "../../components";
import { useContext, useEffect, useState } from "react";
import { profile_icon } from "../../assets/default-icons";
import { authenticationContext } from "../../contexts/AuthenticationContext";
import { UserProfilePage } from "..";
import { getUserFields } from "../../api/requests/user";

export default function Home() {
  const { accessTokenRef, request } = useContext(authenticationContext)!;
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [user, setUser] = useState<User | undefined>(undefined);
  async function fetchUserData() {
    try {
      const fields = ["firstName", "audioFiles", "playlists"];
      const response = await request(
        async () =>
          await getUserFields(fields, { accessToken: accessTokenRef.current })
      );
      setUser(response);
    } catch (err) {
      console.log(err);
    }
  }
  useEffect(() => {
    fetchUserData();
  }, []);

  if (!user) {
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
      <Modal
        show={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
      >
        <UserProfilePage />
      </Modal>
      <hr className="home-header-bottom-line" />
      {user && (
        <MediaGrid
          items={getRecentlyPlayed(user.playlists!, user.audioFiles!)}
          title="Recently Played"
        />
      )}

      {user && (
        <HorizontalScroll
          items={getMostPlayedTracks(user.audioFiles!)}
          title="Most Played Tracks"
        />
      )}

      {user && (
        <HorizontalScroll
          items={getMostPlayedPlaylists(user.playlists!)}
          title="Most Played Playlists"
        />
      )}
    </section>
  );
}

function getRecentlyPlayed(
  playlists: Playlist[],
  audioFiles: AudioFile[],
  limit = 6
) {
  const processedMedia = [...audioFiles].sort(
    // compares when the songs were last played and returns a new sorted array
    (a, b) =>
      (a.lastPlayed ? a.lastPlayed : 0) - (b.lastPlayed ? a.lastPlayed : 0)
  );

  return processedMedia.slice(-limit);
}
function getMostPlayedTracks(audioFiles: AudioFile[], limit = 10) {
  const processedMedia = [...audioFiles].sort(
    (a, b) => a.playbackCount - b.playbackCount
  );

  return processedMedia.slice(-limit);
}

function getMostPlayedPlaylists(playlists: Playlist[], limit = 10) {
  const processedMedia = [...playlists].sort(
    (a, b) => a.playbackCount - b.playbackCount
  );
  return processedMedia.slice(-limit);
}
