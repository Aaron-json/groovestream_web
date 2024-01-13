import "./Library.css";
import {
  Dropdown,
  SearchBar,
  MediaList,
  Modal,
  CreatePlaylist,
  FileInput,
  LoadingSpinnerDiv,
  ProgressBar,
} from "../../components";
import { useContext, useReducer, useState } from "react";
import { supportedAudioFormats } from "../../global/media/media";
import { FileInputError } from "../../components/FileInput/FileInput";
import { getAllUserMedia, uploadAudioFile } from "../../api/requests/media";
import { MediaFilters } from "../../components/MediaList/types";
import { useQuery } from "@tanstack/react-query";
import { getLibraryPageData } from "../../api/requests/page";
import { Task, tasksContext } from "../../contexts/TasksContext";
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
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [mediaFilters, mediaFiltersDispatch] = useReducer(mediaFiltersReducer, {
    /// first element used as the default
    mediaTypes: mediaTypesOptions[0],
    sortBy: sortByOptions[0],
    sort: orderOptions[0],
  });
  const { getTasksCount, addTask, updateTask, removeTask } =
    useContext(tasksContext)!;
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
    // create a new task
    const taskID = Date.now().toString + (Math.random() * 100).toString();
    const task: Task = {
      mode: "progress",
      progress: 0,
      name: "Uploading audio files",
    };
    try {
      await uploadAudioFile(formData, 0, undefined, {
        task,
        taskID,
        addTask,
        removeTask,
        updateTask,
      });
      await refetch();
    } catch (error) {
      removeTask(taskID);
    }
  }

  async function createdPlaylistHandler() {
    setCreatingPlaylist(false);
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
              onClick={() => setCreatingPlaylist(true)}
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
      {getTasksCount() > 0 && <ProgressBar task={{ mode: "loading" }} />}
      <Modal show={creatingPlaylist} onClose={() => setCreatingPlaylist(false)}>
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
