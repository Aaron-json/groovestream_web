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
  audioFiles: (AudioFile | PlaylistAudioFile)[],
  limit = 6
) {
  const totalMedia = [...playlists, ...audioFiles];
  totalMedia.filter((media) => Boolean(media.lastPlayed));
  totalMedia.sort((a, b) => a.lastPlayed - b.lastPlayed);
  return totalMedia.slice(-limit);
}
function getMostPlayedTracks(audioFiles: AudioFile[], limit = 10) {
  const totalMedia = [...audioFiles];
  totalMedia.filter((media) => media.playbackCount !== 0);
  totalMedia.sort((a, b) => a.playbackCount - b.playbackCount);
  return totalMedia.slice(-limit);
}

function getMostPlayedPlaylists(playlists: Playlist[], limit = 10) {
  const totalMedia = [...playlists];
  totalMedia.filter((media) => media.playbackCount !== 0);
  totalMedia.sort((a, b) => a.playbackCount - b.playbackCount);
  return totalMedia.slice(-limit);
}
