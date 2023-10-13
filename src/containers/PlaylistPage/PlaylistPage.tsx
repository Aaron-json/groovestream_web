import "./PlaylistPage.css";
import { useLocation, useParams } from "react-router-dom";
import { MediaList } from "../../components";
import { useEffect, useState, useContext } from "react";
import { authenticationContext } from "../../contexts/AuthenticationContext";
import axiosClient from "../../api/axiosClient";
import { getMediaInfo } from "../../api/requests/media";

// the type playlist is represented by the number 1 in its object under the type field
// use this to make requests
const PlaylistMediaType = 1;
export default function PlaylistPage() {
  const { accessTokenRef, request } = useContext(authenticationContext)!;
  const { mediaID } = useParams();
  const [playlist, setPlaylist] = useState<Playlist>(useLocation().state);
  useEffect(() => {
    if (playlist) {
      // is
      return;
    }
    requestPageInfo();
  }, []);

  async function requestPageInfo() {
    if (!mediaID) return;
    const response = await request(async () =>
      getMediaInfo(mediaID, { accessToken: accessTokenRef.current })
    );
    setPlaylist(response.data);
  }
  if (!playlist) {
    return <div className="loading">Loading...</div>;
  }
  return (
    <section className="media-page">
      <div className="media-page-header">
        <h1>{playlist.name}</h1>
        <h2>Playlist</h2>
      </div>
      <hr />
      <div className="media-page-content">
        <MediaList items={playlist.audioFiles} />
      </div>
    </section>
  );
}
