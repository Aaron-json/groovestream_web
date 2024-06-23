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
import {
  getAudioFileHistory,
  getMostPlayedAudioFiles,
} from "../../api/requests/media";
import { getUser } from "../../api/requests/user";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const navigator = useNavigate();
  const {
    data: userData,
    isLoading: userDataLoading,
    error: userDataErr,
  } = useQuery({ queryKey: ["user"], queryFn: getUser });
  const {
    data: mostPlayed,
    isLoading: loadingMostPlayed,
    error: mostPlayedErr,
  } = useQuery({
    queryKey: ["audiofiles-most-played"],
    queryFn: () => getMostPlayedAudioFiles(10),
  });
  const {
    data: audioFileHistory,
    isLoading: loadingAudioFileHistory,
    error: audioFileHistoryErr,
  } = useQuery({
    queryKey: ["audiofile-listening-history"],
    queryFn: () => getAudioFileHistory(6),
  });
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
            <MediaGrid items={audioFileHistory} title="Recently Played" />
          )}

          {mostPlayed && (
            <HorizontalScroll items={mostPlayed} title="Most Played Tracks" />
          )}
        </>
      );
    }
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
      {getDisplay()}
    </section>
  );
}
