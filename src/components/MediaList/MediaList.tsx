import {
  options_icon,
  delete_icon,
  playlist_icon,
} from "../../assets/default-icons";
import { uploadIcon } from "../../assets/default-icons/MediaList";
import "./MediaList.css";
import { useContext } from "react";
import { mediaContext } from "../../contexts/MediaContext";
import { formatDistanceToNow } from "date-fns";
import { FileInput } from "../";
import {
  getSongIcon,
  getPlaylistIcon,
  supportedAudioFormats,
} from "../../global/media/media";
import { FileInputError } from "../FileInput/FileInput";
import {
  deleteAudioFile,
  deletePlaylist,
  uploadPlaylistAudioFile,
} from "../../api/requests/media";
import { useNavigate } from "react-router-dom";

interface MediaListOptions {}
interface MediaListProps {
  items: (Playlist | AudioFile | PlaylistAudioFile)[];
  searchValue?: string;
  refreshMedia?: () => any;
  title?: string;
  songClickHandler?: () => any;
  playlistClickHandler?: () => any;
  filterOptions?: MediaListOptions;
}

export default function MediaList({
  items,
  searchValue,
  refreshMedia,
  title,
  songClickHandler,
  playlistClickHandler,
}: MediaListProps) {
  // used when an object containing other media is clicked to be able to return
  // to previous lists
  //const [debouncedSearchValue, setDebouncedSearchValue] = useState(searchValue);
  // useEffect(() => {
  //   return debounced(() => {
  //     setDebouncedSearchValue(searchValue);
  //   }, 0);
  // }, [searchValue]);

  // filteredItems will only change if the mediaStack or the debouncedSearch value
  // is changed to prevent unnecessary recalculations and filters
  /**
   * @param {Array} mediaList - the original list of media to be modified
   * @param {string} searchFilter - search value used to filter the media
   * @returns {Array} a NEW array after the filters have been applied.
   * does NOT modify original array
   */
  return (
    <div className="media-list-div">
      {title && (
        // render header ii title is passed or if we are displaying a nested media list
        <div className="media-list-header">
          {/*react will not render the title if it is a null object */}
          <h2 className="media-list-title">{title}</h2>
        </div>
      )}
      {items.length > 0 ? (
        <ol className="media-list">
          {items.map((media, index) => {
            // return all the objects inside the category
            if (media.type === 0 || media.type === 2 || media.type === 4) {
              return (
                <AudioFileTille
                  key={media._id}
                  audioFile={media as AudioFile | PlaylistAudioFile}
                  index={index}
                  songClickHandler={songClickHandler}
                  allMedia={items}
                  refreshMedia={refreshMedia}
                />
              );
            } else if (media.type === 1 || media.type === 3) {
              return (
                <PlaylistTile
                  key={media._id}
                  playlist={media as Playlist}
                  playlistClickHandler={playlistClickHandler}
                  refreshMedia={refreshMedia}
                />
              );
            }
          })}
        </ol>
      ) : (
        <NoMediaItem />
      )}
    </div>
  );
}
interface MediaListSong
  extends Pick<MediaListProps, "songClickHandler" | "refreshMedia"> {
  audioFile: AudioFile | PlaylistAudioFile;
  allMedia: MediaListProps["items"];
  index: number;
}
function AudioFileTille({
  audioFile,
  songClickHandler,
  allMedia,
  index,
  refreshMedia,
}: MediaListSong) {
  const { updateMedia, currentMedia } = useContext(mediaContext)!;
  // the media list from mapping all over again
  async function deleteAudioFileHandler() {
    if (audioFile.type === 0) {
      await deleteAudioFile(audioFile.type, audioFile._id);
    } else {
      await deleteAudioFile(
        audioFile.type,
        audioFile._id,
        (audioFile as PlaylistAudioFile).playlistID
      );
    }

    // if a function to refresh media was passed,
    // call it to get updated media list
    refreshMedia && (await refreshMedia());
  }
  return (
    <li
      className="media-list-song-item"
      onClick={
        songClickHandler ? songClickHandler : () => updateMedia(allMedia, index)
      }
    >
      <img src={getSongIcon(audioFile)} alt="icon" />
      <div className="media-item-info">
        <span className="media-item-name">{audioFile.filename}</span>
        <span className="media-item-artist">
          {audioFile.artists ? audioFile.artists.join(", ") : "Unknown Artist"}
        </span>
        <span className="media-item-album">
          {audioFile.album ? audioFile.album : "Unknown Album"}
        </span>
        <span className="media-item-date-created">
          Uploaded {formatDistanceToNow(new Date(audioFile.createdAt))} ago
        </span>
      </div>
      <span className="media-item-type">
        {currentMedia?._id === audioFile._id ? "Now Playing" : "Song"}
      </span>

      <div className="media-item-options">
        <button
          className="action-icon"
          onClick={(e) => {
            deleteAudioFileHandler();
            e.stopPropagation();
          }}
        >
          <img src={delete_icon} alt="" />
        </button>
        <button className="action-icon" onClick={(e) => e.stopPropagation()}>
          <img src={options_icon} alt="" />
        </button>
      </div>
    </li>
  );
}

interface MediaListPlaylistProps
  extends Pick<MediaListProps, "playlistClickHandler" | "refreshMedia"> {
  playlist: Playlist;
}
function PlaylistTile({
  playlist,
  playlistClickHandler,
  refreshMedia,
}: MediaListPlaylistProps) {
  const navigator = useNavigate();
  async function addSongToPlaylistHandler(
    formData: FormData | undefined,
    error: FileInputError | undefined
  ) {
    if (error || !formData) {
      console.log(error);
      return;
    }
    if (playlist.type === 1) {
      // type 2 is playlist audiofile
      // type 4 is shared playlist audiofile
      await uploadPlaylistAudioFile(formData, playlist._id, 2);
    } else if (playlist.type === 3) {
      await uploadPlaylistAudioFile(formData, playlist._id, 4);
    }

    refreshMedia && (await refreshMedia());
  }
  function handlePlaylistClick() {
    if (playlistClickHandler) {
      playlistClickHandler();
    } else {
      navigator(`/library/media/${playlist.type}/${playlist._id}`, {
        state: playlist,
      });
    }
  }
  async function deletePlaylistHandler() {
    /**
     * Function for deleting any type of media.
     * FUnction is shared so it is on the parent list.
     */
    await deletePlaylist(playlist.type, playlist._id);
    // if a function to refresh media was passed,
    // call it to get updated media list
    refreshMedia && (await refreshMedia());
  }
  return (
    <li className="media-list-playlist-item" onClick={handlePlaylistClick}>
      <img loading="lazy" src={getPlaylistIcon(playlist)} alt="icon" />
      <div className="media-item-info">
        <span className="media-item-name">{playlist.name}</span>
        <span className="playlist-files-count">
          Songs: {playlist.audioFiles.length}
        </span>
        <span className="media-item-date-created">
          Created {formatDistanceToNow(new Date(playlist.createdAt))} ago
        </span>
      </div>
      <span className="media-item-type">
        {playlist.type === 1 && "Playlist"}
        {playlist.type === 3 && "Shared Playlist"}
      </span>
      <div className="media-item-options">
        <label className="action-icon" onClick={(e) => e.stopPropagation()}>
          <img src={uploadIcon} alt="" />
          <FileInput
            onInput={addSongToPlaylistHandler}
            formats={supportedAudioFormats}
            multiple={true}
          />
        </label>
        {playlist.name !== "Favorites" && (
          <button
            className="action-icon"
            onClick={(e) => {
              deletePlaylistHandler();
              e.stopPropagation();
            }}
          >
            <img src={delete_icon} alt="" />
          </button>
        )}

        <button className="action-icon" onClick={(e) => e.stopPropagation()}>
          <img src={options_icon} alt="" />
        </button>
      </div>
    </li>
  );
}

function NoMediaItem() {
  return (
    <div className="media-list-song-item">
      <span>No Media</span>
    </div>
  );
}
