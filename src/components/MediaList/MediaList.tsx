import "./MediaList.css";
import { useCallback, useRef } from "react";
import { AudioFile, MediaType, Playlist } from "../../types/media";
import { MediaListPlaylistTile } from "./PlaylistTile";
import { MediaListAudioFileTile } from "./AudioFileTile";

export interface MediaListProps {
  /** Passed to media player to play the media list. If not provided, audio cannot be played from this medialist*/
  mediaStoreKey?: string
  items: (Playlist | AudioFile)[];
  refreshMedia?: () => any;
  title?: string;
  songClickHandler?: () => any;
  playlistClickHandler?: () => any;
}
export default function MediaList({
  mediaStoreKey,
  items,
  refreshMedia,
  title,
  songClickHandler,
  playlistClickHandler,
}: MediaListProps) {
  // serves as a global ref for updating the media queue for the media context when it changes. The parent component
  // componnent should update the list when it changes and the audio tile that displays the currently playing
  // audio should update its index in the list.

  return (
    <div className="media-list-div">
      {title && (
        <div className="media-list-header">
          <h2 className="media-list-title">{title}</h2>
        </div>
      )}
      {items?.length > 0 ? (
        <ol className="media-list">
          {items.map((media, index) => {
            // return all the objects inside the category
            if (media.type === MediaType.AudioFile) {
              return (
                <MediaListAudioFileTile
                  key={media.storageId}
                  audioFile={media}
                  songClickHandler={songClickHandler}
                  allMedia={items}
                  refreshMedia={refreshMedia}
                  index={index}
                  mediaStoreKey={mediaStoreKey}
                />
              );
            } else if (media.type === MediaType.Playlist) {
              return (
                <MediaListPlaylistTile
                  key={media.id}
                  playlist={media}
                  playlistClickHandler={playlistClickHandler}
                  refreshMedia={refreshMedia}
                />
              );
            }
          })}
        </ol>
      ) : (
        <NoMediaTile />
      )}
    </div>
  );
}
function NoMediaTile() {
  return (
    <div className="media-list-song-item">
      <div>No Media</div>
    </div>
  );
}
