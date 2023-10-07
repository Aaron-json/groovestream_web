import "./PlaylistPage.css";
import { useLocation, useParams } from "react-router-dom";
import { MediaList } from "../../components";
import { useEffect, useState, useContext } from "react";
import { authenticationContext } from "../../contexts/AuthenticationContext";
import axiosClient from "../../api/axiosClient";

export default function PlaylistPage() {
  const { accessTokenRef, request } = useContext(authenticationContext)!;
  const { mediaID } = useParams();
  const [playlist, setPlaylist] = useState(useLocation().state);
  useEffect(() => {
    if (playlist) {
      return;
    }
    requestPageInfo();
  }, []);

  async function requestPageInfo() {
    console.log(mediaID);
    const response = await request(async () => {
      return await axiosClient.get(`media/info/1/${mediaID}`, {
        headers: {
          Authorization: `Bearer ${accessTokenRef.current}`,
        },
      });
    });
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
