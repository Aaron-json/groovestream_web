import { options_icon, delete_icon } from "../../assets/default-icons";
import {
  mediaListBackIcon,
  plusIcon,
} from "../../assets/default-icons/MediaList";
import moment from "moment";
import "./MediaList.css";
import { useContext, useEffect, useMemo, useState } from "react";
import { authenticationContext } from "../../contexts/AuthenticationContext";
import { mediaContext } from "../../contexts/MediaContext";
import { FileInput } from "../";
import {
  getSongIcon,
  getPlaylistIcon,
  supportedAudioFormats,
} from "../../global/media";
import { FileInputError } from "../FileInput/FileInput";
import {
  deleteAudioFile,
  deletePlaylist,
  uploadPlaylistAudioFile,
} from "../../api/requests/media";

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

interface MediaListItem {
  //media string is for the id of the nested object that contains the media
  // typicallly referencing a playlists's audioFiles array
  title: string;
  media: string;
}

interface HydratedMediaListItem extends Omit<MediaListItem, "media"> {
  media: MediaListRootMedia;
}

interface MediaListRootItem {
  title: string | undefined;
  media: MediaListRootMedia;
}
type MediaListRootMedia = MediaListProps["items"];

type MediaListStack = [MediaListRootItem, ...MediaListItem[]];
type PushToMediaListStack = (mediaID: string, title: string) => void;
type PopFromMediaListStack = () => void;

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
  const [mediaListStack, setMediaListStack] = useState<MediaListStack>([
    { title, media: items },
  ]);
  //const [debouncedSearchValue, setDebouncedSearchValue] = useState(searchValue);

  const currentMedia = useMemo(_getCurrentObj, [mediaListStack]);
  const currentMediaList = currentMedia.media;
  const currentMediaTitle = currentMedia.title;
  // consider applying useMemo if other states can also cause a rerender
  // but we want the filters to be  memoized and not re-filter the list
  // CAUTION in setting dependencies to it doesnt cause rerenders

  // useEffect(() => {
  //   return debounced(() => {
  //     setDebouncedSearchValue(searchValue);
  //   }, 0);
  // }, [searchValue]);

  useEffect(
    /**
     * Updates the root in the stack when it changes.
     * Ideally the "_getCUrrentObj" method should be ran again to
     * get the current path in case any changes happened to it
     */
    () => {
      const originalTitle = mediaListStack[0].title; //get the title of root
      const updatedStack: MediaListStack = [...mediaListStack]; // copy to new list so react updates
      updatedStack[0] = {
        media: items,
        title: originalTitle,
      }; // replace old root with new items
      setMediaListStack(updatedStack);
    },
    [items]
  );

  /**
   * Function that traverses the path in the stack to get the current list from the object.
   * Runs everytime and "update" method, such as "delete", is done on the list elements.
   */
  function _getCurrentObj(): MediaListRootItem | HydratedMediaListItem {
    if (mediaListStack.length === 1) {
      return mediaListStack[0];
    } else {
      let currentList = mediaListStack[0].media;
      for (let i = 1; i < mediaListStack.length; i++) {
        currentList = currentList.find(
          (element) => element._id === mediaListStack[i].media
        )!;
      }
      // if cannot find the nested list, reset back to root
      if (!currentList) {
        return {
          media: items,
          title: mediaListStack[0].title,
        };
      }
      return {
        media: currentList.audioFiles,
        title: mediaListStack[mediaListStack.length - 1].title,
      };
    }
  }

  // filteredItems will only change if the mediaStack or the debouncedSearch value
  // is changed to prevent unnecessary recalculations and filters
  const filteredItems = useMemo(
    () => filterMedia(currentMediaList, searchValue),
    [mediaListStack]
  );
  /**
   * @param {Array} mediaList - the original list of media to be modified
   * @param {string} searchFilter - search value used to filter the media
   * @returns {Array} a NEW array after the filters have been applied.
   * does NOT modify original array
   */
  function filterMedia(
    mediaList: MediaListProps["items"],
    searchFilter?: string
  ) {
    if (searchFilter === "" || searchFilter === " " || !searchFilter)
      return mediaList;
    searchFilter = searchFilter.toLowerCase();
    return mediaList.filter((mediaItem) => {
      // check if mediaItem's name, album or artists match the search filter
      if (mediaItem.type === 0) {
        if (
          (mediaItem as AudioFile).filename.toLowerCase().includes(searchFilter)
        )
          return true;
        if (
          (mediaItem as AudioFile).artists &&
          (mediaItem as AudioFile).artists
            .join(" ")
            .toLowerCase()
            .includes(searchFilter)
        )
          return true;
        if (
          (mediaItem as AudioFile).album &&
          (mediaItem as AudioFile).album.toLowerCase().includes(searchFilter)
        )
          return true;

        return false;
      } else if (mediaItem.type === 1) {
        return (mediaItem as Playlist).name
          .toLowerCase()
          .includes(searchFilter);
      } else {
        return false;
      }
    });
  }

  function addMediaListToStack(mediaID: string, title: string) {
    setMediaListStack([...mediaListStack, { title, media: mediaID }]);
  }
  function popMediaListFromStack() {
    if (mediaListStack.length === 1) return;
    setMediaListStack(mediaListStack.slice(0, mediaListStack.length - 1));
  }

  return (
    <div className="media-list-div">
      {(mediaListStack.length > 1 || currentMediaTitle) && (
        // render header ii title is passed or if we are displaying a nested media list
        <div className="media-list-header">
          {mediaListStack.length > 1 && (
            <button
              onClick={popMediaListFromStack}
              className="media-list-back-btn"
            >
              <img src={mediaListBackIcon} alt="" />
            </button>
          )}
          {/*react will not render the title if it is a null object */}
          <h2 className="media-list-title">{currentMediaTitle}</h2>
        </div>
      )}
      {filteredItems.length > 0 ? (
        <ol className="media-list">
          {filteredItems.map((media, index) => {
            // return all the objects inside the category
            if (media.type === 0 || media.type === 2) {
              return (
                <LibrarySong
                  key={media._id}
                  audioFile={media}
                  index={index}
                  songClickHandler={songClickHandler}
                  allMedia={filteredItems}
                  refreshMedia={refreshMedia}
                />
              );
            } else if (media.type === 1) {
              return (
                <LibraryPlaylist
                  key={media._id}
                  playlist={media}
                  playlistClickHandler={playlistClickHandler}
                  addMediaListToStack={addMediaListToStack}
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
function LibrarySong({
  audioFile,
  songClickHandler,
  allMedia,
  index,
  refreshMedia,
}: MediaListSong) {
  const { updateMedia, currentMedia } = useContext(mediaContext)!;
  const { request, accessTokenRef } = useContext(authenticationContext)!;
  // the media list from mapping all over again
  async function deleteAudioFileHandler() {
    await request(
      async () =>
        await deleteAudioFile(audioFile, {
          accessToken: accessTokenRef.current,
        })
    );
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
          Uploaded {moment(audioFile.dateUploaded).fromNow()}
        </span>
      </div>
      <span className="media-item-type">
        {currentMedia?._id === audioFile._id ? "Now Playing" : "Song"}
      </span>

      <div className="media-item-options">
        <button
          onClick={(e) => {
            deleteAudioFileHandler();
            e.stopPropagation();
          }}
        >
          <img src={delete_icon} alt="" />
        </button>
        <button onClick={(e) => e.stopPropagation()}>
          <img src={options_icon} alt="" />
        </button>
      </div>
    </li>
  );
}

interface MediaListPlaylistProps
  extends Pick<MediaListProps, "playlistClickHandler" | "refreshMedia"> {
  playlist: Playlist;
  addMediaListToStack: PushToMediaListStack;
}
function LibraryPlaylist({
  playlist,
  playlistClickHandler,
  addMediaListToStack,
  refreshMedia,
}: MediaListPlaylistProps) {
  const { request, accessTokenRef } = useContext(authenticationContext)!;

  async function addSongToPlaylistHandler(
    formData: FormData | undefined,
    error: FileInputError | undefined
  ) {
    if (error || !formData) {
      console.log(error);
      return;
    }
    await request(
      async () =>
        await uploadPlaylistAudioFile(formData, playlist, {
          accessToken: accessTokenRef.current,
        })
    );
    refreshMedia && (await refreshMedia());
  }
  function handlePlaylistClick() {
    if (playlistClickHandler) {
      playlistClickHandler();
    } else {
      addMediaListToStack(playlist._id, playlist.name);
    }
  }
  async function deletePlaylistHandler() {
    /**
     * Function for deleting any type of media.
     * FUnction is shared so it is on the parent list.
     */
    await request(
      async () =>
        await deletePlaylist(playlist, { accessToken: accessTokenRef.current })
    );
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
          Created {moment(playlist.dateCreated).fromNow()}
        </span>
      </div>
      <span className="media-item-type">Playlist</span>
      <div className="media-item-options">
        <label onClick={(e) => e.stopPropagation()}>
          <img src={plusIcon} alt="" />
          <FileInput
            onInput={addSongToPlaylistHandler}
            formats={supportedAudioFormats}
          />
        </label>
        {playlist.name !== "Favorites" && (
          <button
            onClick={(e) => {
              deletePlaylistHandler();
              e.stopPropagation();
            }}
          >
            <img src={delete_icon} alt="" />
          </button>
        )}

        <button onClick={(e) => e.stopPropagation()}>
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
