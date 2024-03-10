import "./Library.css";
import {
  Dropdown,
  SearchBar,
  MediaList,
  Modal,
  CreatePlaylist,
  LoadingSpinnerDiv,
  ProgressBar,
} from "../../components";
import { useContext, useMemo, useReducer, useState } from "react";

import { getAllUserMedia } from "../../api/requests/media";
import { MediaFilters } from "../../components/MediaList/types";
import { useQuery } from "@tanstack/react-query";
import { TaskType, tasksContext } from "../../contexts/TasksContext";
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
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [mediaFilters, mediaFiltersDispatch] = useReducer(mediaFiltersReducer, {
    /// first element used as the default
    mediaTypes: mediaTypesOptions[0],
    sortBy: sortByOptions[0],
    sort: orderOptions[0],
  });
  const { getTasks } = useContext(tasksContext)!;
  const mediaTasks = getTasks(TaskType.Media);
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

  async function createdPlaylistHandler() {
    setCreatingPlaylist(false);
    await refetch();
  }
  function getDisplapy() {
    if (error) {
      return <div>Error Encountered</div>;
    } else if (isLoading) {
      return <LoadingSpinnerDiv />;
    } else {
      return (
        <MediaList
          items={allMedia!}
          searchValue={searchValue}
          refreshMedia={refetch}
        />
      );
    }
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
        <button
          className="add-resource-button"
          onClick={() => setCreatingPlaylist(true)}
        >
          Create New Playlist
        </button>
      </div>
      {mediaTasks.length > 0 && <ProgressBar tasks={mediaTasks} />}
      <Modal show={creatingPlaylist} onClose={() => setCreatingPlaylist(false)}>
        <CreatePlaylist onFinish={createdPlaylistHandler} />
      </Modal>
      {getDisplapy()}
    </section>
  );
}
