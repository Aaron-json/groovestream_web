import "./MediaPage.css";
import { useLocation, useParams } from "react-router-dom";
import { mediaTypeToField } from "../../global/media";
import { MediaList } from "../../components";

export default function MediaPage() {
  const { mediaID, mediaType } = useParams();
  const media = useLocation().state;

  return (
    <section className="media-page">
      <div className="media-page-header">
        <h1>{media.name}</h1>
        <h2>{mediaTypeToField[mediaType]}</h2>
      </div>
      <div className="media-page-content">
        <MediaList items={media.audioFiles} />
      </div>
    </section>
  );
}
