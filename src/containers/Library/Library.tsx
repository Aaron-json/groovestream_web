import "./Library.css";
import {
  Dropdown,
  SearchBar,
  MediaList,
  Modal,
  CreatePlaylist,
  FileInput,
  LoadingSpinnerDiv,
} from "../../components";
import { useReducer, useState } from "react";
import { supportedAudioFormats } from "../../global/media/media";
import { FileInputError } from "../../components/FileInput/FileInput";
import { getAllUserMedia, uploadAudioFile } from "../../api/requests/media";
import { MediaFilters } from "../../components/MediaList/types";
import { useQuery } from "@tanstack/react-query";
import { getLibraryPageData } from "../../api/requests/page";
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

  const [searchValue, setSearchValue] = useState("");
  const {
    data: allMedia,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["library"],
    queryFn: getAllUserMedia,
  });

  function handleAddingMedia() {
    setAddingMedia(!addingMedia);
  }

  async function handleFileInput(
    formData: FormData | undefined,
    error: FileInputError | undefined
  ) {
    if (error || !formData) {
      console.log(error);
      return;
    }
    await uploadAudioFile(formData);

    await refetch();
  }

  async function createdPlaylistHandler() {
    setAddingPlaylist(false);
    await refetch();
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
        <button className="add-resource-button" onClick={handleAddingMedia}>
          {/* &#43; */}
          Add Media
        </button>

        {addingMedia && (
          <>
            <button
              className="add-resource-button"
              onClick={() => setAddingPlaylist(true)}
            >
              Create New Playlist
            </button>
            <label className="add-resource-button">
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

      {isLoading ? (
        <LoadingSpinnerDiv />
      ) : (
        <MediaList
          items={allMedia}
          searchValue={searchValue}
          refreshMedia={refetch}
        />
      )}
    </section>
  );
}
