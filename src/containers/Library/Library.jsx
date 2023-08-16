import "./Library.css";
import {
  Dropdown,
  SearchBar,
  MediaList,
  Modal,
  CreatePlaylist,
} from "../../components";
import { useContext, useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { authenticationContext } from "../../contexts/AuthenticationContext";
import { retryRequest, debounced } from "../../api/requests";
import { Route, Routes } from "react-router-dom";

const categories = {
  /**
   * 0 : audioFiles
   * 1 : playlists
   */
  All: [0, 1],
  Songs: [0],
  Playlists: [1],
};
const sortBy = { Name: "name", Date: "dateCreated" };
const order = { "A-Z": "ascending", "Z-A": "descending" };
export default function Library() {
  const [addingMedia, setAddingMedia] = useState(false);
  const [addingPlaylist, setAddingPlaylist] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("All");
  const [currentSort, setCurrentSort] = useState("Name");
  const [currentOrder, setCurrentOrder] = useState("A-Z");
  const [results, setResults] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const { accessTokenRef, refreshAuthentication } = useContext(
    authenticationContext
  );
  console.log("library page rendered");
  async function fetchMedia() {
    // fetches all media at startup of the application
    try {
      const response = await retryRequest(async () => {
        return await axiosClient.get("/user", {
          headers: {
            Authorization: `Bearer ${accessTokenRef.current}`,
          },
          params: {
            fields: ["audioFiles", "playlists"],
          },
        });
      }, refreshAuthentication);

      // the order of arrays in results corresponds to the order in the fields
      // query params
      setResults(response.data);
    } catch (err) {
      console.log(err);
    }
  }

  function handleAddingMedia(e) {
    setAddingMedia(!addingMedia);
  }

  useEffect(() => {
    fetchMedia();
  }, []);

  async function handleFileInput(e) {
    const files = e.target.files;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("media", files[i]);
    }
    const response = await retryRequest(
      async () =>
        await axiosClient.post("/media/0", formData, {
          headers: {
            Authorization: `Bearer ${accessTokenRef.current}`,
            "Content-Type": "multipart/form-data",
          },
        }),
      refreshAuthentication
    );
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
          items={Object.keys(categories)}
          currentItem={currentCategory}
          setCurrentItem={setCurrentCategory}
        />
        <Dropdown
          items={Object.keys(sortBy)}
          currentItem={currentSort}
          setCurrentItem={setCurrentSort}
        />
        <Dropdown
          items={Object.keys(order)}
          currentItem={currentOrder}
          setCurrentItem={setCurrentOrder}
        />
      </div>

      <div className="file-upload-div">
        <button className="add-file-btn" onClick={handleAddingMedia}>
          +
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
              <input
                name="media"
                type="file"
                id="file-input"
                multiple
                onInput={handleFileInput}
                onClick={(e) => {
                  e.target.value = null;
                }}
              />
            </label>
          </>
        )}
      </div>

      <Modal show={addingPlaylist} onClose={() => setAddingPlaylist(false)}>
        <CreatePlaylist />
      </Modal>

      {results === null ? (
        <div className="loading-div">Loading...</div>
      ) : (
        <MediaList
          items={filterMedia(results.playlists, results.audioFiles)}
          searchValue={searchValue}
          refreshMedia={fetchMedia}
        />
      )}
    </section>
  );
}

function filterMedia(
  playlists,
  audioFiles,
  selectedMediaType,
  searchValue,
  sortOrder
) {
  return playlists.concat(audioFiles);
}
