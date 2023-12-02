import "./Home.css";
import {
  MediaGrid,
  HorizontalScroll,
  Modal,
  LoadingSpinnerDiv,
} from "../../components";
import { useState } from "react";
import { profile_icon } from "../../assets/default-icons";
import { UserProfilePage } from "..";
import { useQuery } from "@tanstack/react-query";
import { getHomePageData } from "../../api/requests/page";

export default function Home() {
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const {
    data: userData,
    isLoading,
    error,
  } = useQuery(["homePage"], getHomePageData);
  if (isLoading) {
    return <LoadingSpinnerDiv />;
  }
  if (error) {
    return <div>Error Occcured</div>;
  }
  return (
    <section className="home-page">
      <div className="home-header">
        <h1 className="welcome-message">
          Hello {userData && userData.firstName}
        </h1>
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
      {userData && (
        <MediaGrid
          items={getRecentlyPlayed(userData.playlists!, userData.audioFiles!)}
          title="Recently Played"
        />
      )}

      {userData && (
        <HorizontalScroll
          items={getMostPlayedTracks(userData.audioFiles!)}
          title="Most Played Tracks"
        />
      )}

      {userData && (
        <HorizontalScroll
          items={getMostPlayedPlaylists(userData.playlists!)}
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
