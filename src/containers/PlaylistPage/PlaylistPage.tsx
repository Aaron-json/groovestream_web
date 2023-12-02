import "./PlaylistPage.css";
import { useParams } from "react-router-dom";
import { FileInput, MediaList } from "../../components";
import {
  getPlaylistData,
  getPlaylistAudioFileInfo,
  uploadPlaylistAudioFile,
} from "../../api/requests/media";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "../../components/Spinner/Spinner";
import {
  getPlaylistIcon,
  supportedAudioFormats,
} from "../../global/media/media";
import { FileInputError } from "../../components/FileInput/FileInput";

export default function PlaylistPage() {
  // playlistID will always be ine url to navigate to this page
  // so it will not be undefined. it is safe to use non-null assertion on it
  const { mediaID, mediaType } = useParams();
  const {
    data: playlistData,
    error,
    isLoading,
    refetch,
  } = useQuery(["playlist", mediaID], () =>
    getPlaylistData(mediaType!, mediaID!)
  );
  if (isLoading) {
    return (
      <div className="loading-div">
        <LoadingSpinner size={70} />
      </div>
    );
  }
  if (error) {
    <span>Error Occured</span>;
  }
  async function handleUploadSongToPlaylist(
    formData: FormData | undefined,
    error: FileInputError | undefined
  ) {
    if (!formData || error) {
      return;
    }
    try {
      if (playlistData.type === 1) {
        // type 2 is playlist audiofile
        // type 4 is shared playlist audiofile
        await uploadPlaylistAudioFile(formData, mediaID!, 2);
      } else if (playlistData.type === 3) {
        await uploadPlaylistAudioFile(formData, playlistData._id, 4);
      }
      refetch();
    } catch (error) {}
  }
  return (
    <section className="playlist-page">
      <div className="playlist-page-background">
        <img src={getPlaylistIcon(playlistData)} alt="" />
      </div>
      <div className="playlist-page-header">
        <div className="playlist-page-header-left">
          <h1>{playlistData.name}</h1>
          <h2>Playlist</h2>
        </div>
      </div>
      <hr />
      <label className="add-resource-button">
        Upload Song
        <FileInput
          formats={supportedAudioFormats}
          multiple
          onInput={handleUploadSongToPlaylist}
        />
      </label>
      <div className="playlist-page-content">
        <MediaList items={playlistData.audioFiles} refreshMedia={refetch} />
      </div>
    </section>
  );
}
