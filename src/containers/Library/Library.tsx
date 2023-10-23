import "./Library.css";
import {
  Dropdown,
  SearchBar,
  MediaList,
  Modal,
  CreatePlaylist,
  FileInput,
} from "../../components";
import { useEffect, useReducer, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { supportedAudioFormats } from "../../global/media";
import { FileInputError } from "../../components/FileInput/FileInput";
import { uploadAudioFile } from "../../api/requests/media";
import { MediaFilters } from "../../components/MediaList/types";
interface MediaFiltersActions {
  filter: keyof MediaFilters;
  value: any;
}
const mediaTypesOptions = [
  /**
   * 0 : audioFiles
   * 1 : playlists
   */
  "All",
  "Songs",
  "Playlists",
];
const sortByOptions = ["Name", "Date Created"];
const orderOptions = ["Ascending", "Descending"];
function mediaFiltersReducer(
  mediaFilters: MediaFilters,
  action: MediaFiltersActions
): MediaFilters {
  switch (action.filter) {
    case "mediaTypes":
      return { ...mediaFilters, mediaTypes: action.value };
    case "sortBy":
      return { ...mediaFilters, sortBy: action.value };
    case "sort":
      return { ...mediaFilters, sort: action.value };
    default:
      return mediaFilters;
  }
}
export default function Library() {
  const [addingMedia, setAddingMedia] = useState(false);
  const [addingPlaylist, setAddingPlaylist] = useState(false);
  const [mediaFilters, mediaFiltersDispatch] = useReducer(mediaFiltersReducer, {
    mediaTypes: mediaTypesOptions[0],
    sortBy: sortByOptions[0],
    sort: orderOptions[0],
  });
  const [results, setResults] = useState<
    Pick<User, "audioFiles" | "playlists"> | undefined
  >(undefined);
  const [searchValue, setSearchValue] = useState("");
  async function fetchMedia() {
    // fetches all media at startup of the application
    try {
      const response = await axiosClient.get("/user", {
        params: {
          fields: ["audioFiles", "playlists"],
        },
      });

      // the order of arrays in results corresponds to the order in the fields
      // query params
      setResults(response.data);
    } catch (err) {
      console.log(err);
    }
  }

  function handleAddingMedia() {
    setAddingMedia(!addingMedia);
  }

  useEffect(() => {
    fetchMedia();
  }, []);

  async function handleFileInput(
    formData: FormData | undefined,
    error: FileInputError | undefined
  ) {
    if (error || !formData) {
      console.log(error);
      return;
    }
    await uploadAudioFile(formData);

    await fetchMedia();
  }

  async function createdPlaylistHandler() {
    setAddingPlaylist(false);
    await fetchMedia();
  }
  return (
    <section className="library-page">
      <div className="library-page-header">
        <h1>Your Library</h1>
        <SearchBar
          value={searchValue}
          valueChangeHandler={setSearchValue}
          placeholder="Search your library"
        />
      </div>
      <hr />
      <div className="library-results-options">
        <Dropdown
          items={mediaTypesOptions}
          currentItemIndex={mediaTypesOptions.indexOf(mediaFilters.mediaTypes)}
          setCurrentItemIndex={(newItemIndex: number) =>
            mediaFiltersDispatch({
              filter: "mediaTypes",
              value: mediaTypesOptions[newItemIndex],
            })
          }
        />
        <Dropdown
          items={sortByOptions}
          currentItemIndex={sortByOptions.indexOf(mediaFilters.sortBy)}
          setCurrentItemIndex={(newItemIndex) => {
            mediaFiltersDispatch({
              filter: "sortBy",
              value: sortByOptions[newItemIndex],
            });
          }}
        />
        <Dropdown
          items={orderOptions}
          currentItemIndex={orderOptions.indexOf(mediaFilters.sort)}
          setCurrentItemIndex={(newItemIndex: number) => {
            mediaFiltersDispatch({
              filter: "sort",
              value: orderOptions[newItemIndex],
            });
          }}
        />
      </div>

      <div className="file-upload-div">
        <button className="add-file-btn" onClick={handleAddingMedia}>
          &#43;
        </button>

        {addingMedia && (
          <>
            <button
              className="add-media-options"
              onClick={() => setAddingPlaylist(true)}
            >
              Create New Playlist
            </button>
            <label className="add-media-options">
              Upload Song
              <FileInput
                onInput={handleFileInput}
                multiple={true}
                formats={supportedAudioFormats}
              />
            </label>
          </>
        )}
      </div>

      <Modal show={addingPlaylist} onClose={() => setAddingPlaylist(false)}>
        <CreatePlaylist onFinish={createdPlaylistHandler} />
      </Modal>

      {!results ? (
        <div className="loading-div">Loading...</div>
      ) : (
        <MediaList
          items={filterMedia(results!.playlists!, results!.audioFiles!)}
          searchValue={searchValue}
          refreshMedia={fetchMedia}
        />
      )}
    </section>
  );
}

function filterMedia(
  playlists: Playlist[],
  audioFiles: AudioFile[]
): Array<AudioFile | Playlist> {
  return [...playlists, ...audioFiles];
}
