import {
  playlist_icon,
  library_icon,
  music_icon,
  music_icon2,
  options_icon,
  delete_icon,
} from "../../default-icons";
import { mediaListBackIcon } from "../../default-icons/MediaList";
import moment from "moment";
import "./MediaList.css";
import { debounced, retryRequest } from "../../api/requests";
import axiosClient from "../../api/axiosClient";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { authenticationContext } from "../../contexts/AuthenticationContext";
import { mediaContext } from "../../contexts/MediaContext";

export default function LibraryMedia({
  items,
  searchValue,
  refreshMedia,
  title,
  songClickHandler,
  playlistClickHandler,
}) {
  // used when an object containing other media is clicked to be able to return
  // to previous lists
  const [mediaListStack, setMediaListStack] = useState([
    { title, media: items },
  ]);
  const [debouncedSearchValue, setDebouncedSearchValue] = useState(searchValue);
  const { refreshAuthentication, accessTokenRef } = useContext(
    authenticationContext
  );

  const currentMedia = _getCurrentObj();
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
      const originalTitle = mediaListStack[0].title;
      const updatedStack = [...mediaListStack];
      updatedStack[0] = {
        media: items,
        title: originalTitle,
      };
      setMediaListStack(updatedStack);
    },
    [items]
  );

  /**
   * Function that traverses the path in the stack to get the current list from the object.
   * Runs everytime and "update" method, such as "delete", is done on the list elements.
   * @returns {Object} Object containing the title and media list of the top element in the stack
   */
  function _getCurrentObj() {
    if (mediaListStack.length === 1) {
      return mediaListStack[0];
    } else {
      let currentList = mediaListStack[0].media;
      for (let i = 1; i < mediaListStack.length; i++) {
        currentList = currentList.find(
          (element) => element._id === mediaListStack[i].media
        );
      }
      return {
        media: currentList,
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
  function filterMedia(mediaList, searchFilter) {
    if (searchFilter === "" || searchFilter === " " || !searchFilter)
      return mediaList;
    searchFilter = searchFilter.toLowerCase();
    return mediaList.filter((mediaItem) => {
      // check if mediaItem's name, album or artists match the search filter
      if (mediaItem.type === 0) {
        if (mediaItem.filename.toLowerCase().includes(searchFilter))
          return true;
        if (
          mediaItem.artists &&
          mediaItem.artists.join(" ").toLowerCase().includes(searchFilter)
        )
          return true;
        if (
          mediaItem.album &&
          mediaItem.album.toLowerCase().includes(searchFilter)
        )
          return true;

        return false;
      } else if (mediaItem.type === 1) {
        return mediaItem.name.toLowerCase().includes(searchFilter);
      } else {
        return false;
      }
    });
  }

  function addMediaListToStack(mediaID, title) {
    setMediaListStack([...mediaListStack, { title, media: mediaID }]);
  }
  function popMediaListFromStack() {
    if (mediaListStack.length === 1) return;
    setMediaListStack(mediaListStack.slice(0, mediaListStack.length - 1));
  }
  async function deleteMedia(mediaID, mediaType) {
    /**
     * Function for deleting any type of media.
     * FUnction is shared so it is on the parent list.
     */
    await retryRequest(async () => {
      await axiosClient.delete(`/media/${mediaType}/${mediaID}`, {
        headers: {
          Authorization: `Bearer ${accessTokenRef.current}`,
        },
      });
    }, refreshAuthentication);

    // if a function to refresh media was passed,
    // call it to get updated media list
    refreshMedia && (await refreshMedia());
  }

  return (
    <div className="media-list-div">
      {(mediaListStack.length > 1 || currentMediaTitle) && (
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
            if (media.type === 0) {
              return (
                <LibrarySong
                  key={media._id}
                  media={media}
                  index={index}
                  deleteMedia={deleteMedia}
                  songClickHandler={songClickHandler}
                  allMedia={filteredItems}
                />
              );
            } else if (media.type === 1) {
              return (
                <LibraryPlaylist
                  key={media._id}
                  playlist={media}
                  deleteMedia={deleteMedia}
                  playlistClickHandler={playlistClickHandler}
                  addMediaListToStack={addMediaListToStack}
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
function LibrarySong({
  media,
  deleteMedia,
  songClickHandler,
  allMedia,
  index,
}) {
  const { updateMedia, currentMedia } = useContext(mediaContext);
  // consume media context in child components to prevent
  // the media list from mapping all over again
  return (
    <li
      className="media-list-song-item"
      onClick={
        songClickHandler ? songClickHandler : () => updateMedia(allMedia, index)
      }
    >
      <img
        src={
          media.icon
            ? `data:${media.icon.mimeType};base64,${media.icon.data}`
            : music_icon
        }
        alt="icon"
      />
      <div className="media-item-info">
        <span className="media-item-name">{media.filename}</span>
        <span className="media-item-artist">
          {media.artists ? media.artists.join(", ") : "Unknown Artist"}
        </span>
        <span className="media-item-album">
          {media.album ? media.album : "Unknown Album"}
        </span>
        <span className="media-item-date-created">
          Uploaded {moment(media.dateUploaded).fromNow()}
        </span>
      </div>
      <span className="media-item-type">
        {currentMedia?._id === media._id ? "Now Playing" : "Song"}
      </span>

      <div className="media-item-options">
        <button
          onClick={(e) => {
            deleteMedia(media._id, media.type);
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

function LibraryPlaylist({
  playlist,
  deleteMedia,
  playlistClickHandler,
  addMediaListToStack,
}) {
  function handlePlaylistClick() {
    if (playlistClickHandler) {
      playlistClickHandler();
    } else {
      addMediaListToStack(playlist._id, playlist.name);
    }
  }
  return (
    <li className="media-list-playlist-item" onClick={handlePlaylistClick}>
      <img src={library_icon} alt="icon" />
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
        {playlist.name !== "Favorites" && (
          <button
            onClick={(e) => {
              deleteMedia(playlist._id, playlist.type);
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
    <li className="no-media-item media-list-song-item">
      <span>No Media</span>
    </li>
  );
}
