import "./PlaylistPage.css";
import { useLocation, useParams } from "react-router-dom";
import { MediaList } from "../../components";
import { useEffect, useState } from "react";
import { getMediaInfo } from "../../api/requests/media";
// the type playlist is represented by the number 1 in its object under the type field
// use this to make requests
export default function PlaylistPage() {
  const { mediaID } = useParams();
  const [playlist, setPlaylist] = useState<Playlist>(useLocation().state);
  useEffect(() => {
    if (!playlist) {
      requestPageInfo();
    }
  }, []);

  async function requestPageInfo() {
    if (!mediaID) return;
    const response = await getMediaInfo(mediaID);
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
