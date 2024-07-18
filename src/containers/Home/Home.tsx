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
import { getUser } from "../../api/requests/user";
import { useNavigate } from "react-router-dom";
import { useListeningHistory, useMostPlayed } from "../../hooks/media";

export default function Home() {
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const navigator = useNavigate();
  const {
    data: userData,
    isLoading: userDataLoading,
    error: userDataErr,
  } = useQuery({ queryKey: ["user"], queryFn: getUser });

  // MOST PLAYED
  const MOST_PLAYED_AUDIOFILES_STORE_KEY = "audiofiles-most-played";
  const {
    data: mostPlayed,
    isLoading: loadingMostPlayed,
    error: mostPlayedErr,
  } = useMostPlayed(
    MOST_PLAYED_AUDIOFILES_STORE_KEY, 10
  );

  // LISTENING HISTORY
  const LISTENING_HISTORY_STORE_KEY = "audiofile-listening-history";
  const {
    data: audioFileHistory,
    isLoading: loadingAudioFileHistory,
    error: audioFileHistoryErr,
  } = useListeningHistory(LISTENING_HISTORY_STORE_KEY, 6);

  function getDisplay() {
    if (userDataErr || mostPlayedErr || audioFileHistoryErr) {
      return <div>Error occured</div>;
    } else if (
      userDataLoading ||
      loadingAudioFileHistory ||
      loadingMostPlayed
    ) {
      return <LoadingSpinnerDiv />;
    } else if (!audioFileHistory?.length) {
      return (
        <div
          className="tile home-no-media-message"
          onClick={() => navigator("/library")}
        >
          Click here to add music and start listening.
        </div>
      );
    } else {
      return (
        <>
          {audioFileHistory && (
            <MediaGrid mediaStoreKey={LISTENING_HISTORY_STORE_KEY} items={audioFileHistory} title="Recently Played" />
          )}

          {mostPlayed && (
            <HorizontalScroll mediaStoreKey={MOST_PLAYED_AUDIOFILES_STORE_KEY} items={mostPlayed} title="Most Played Tracks" />
          )}
        </>
      );
    }
  }

  return (
    <section className="home-page">
      <div className="home-header">
        <h1 className="welcome-message">
          Hello {userData && userData.username}
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
      {getDisplay()}
    </section>
  );
}
