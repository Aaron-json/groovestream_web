import "./Library.css";
import {
  Dropdown,
  SearchBar,
  MediaList,
  Modal,
  CreatePlaylist,
  FileInput,
} from "../../components";
import { useContext, useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { authenticationContext } from "../../contexts/AuthenticationContext";
import { debounced } from "../../api/requests";
import { supportedAUdioFormats } from "../../global/media";
import { FileInputError } from "../../components/FileInput/FileInput";

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
  const { accessTokenRef, refreshAuthentication, request } = useContext(
    authenticationContext
  )!;
  async function fetchMedia() {
    // fetches all media at startup of the application
    try {
      const response = await request(async () => {
        console.log("fetching media");
        return await axiosClient.get("/user", {
          headers: {
            Authorization: `Bearer ${accessTokenRef.current}`,
          },
          params: {
            fields: ["audioFiles", "playlists"],
          },
        });
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
    const response = await request(
      async () =>
        await axiosClient.post("/media/0", formData, {
          headers: {
            Authorization: `Bearer ${accessTokenRef.current}`,
            "Content-Type": "multipart/form-data",
          },
        })
    );
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
                formats={supportedAUdioFormats}
              />
            </label>
          </>
        )}
      </div>

      <Modal show={addingPlaylist} onClose={() => setAddingPlaylist(false)}>
        <CreatePlaylist onFinish={createdPlaylistHandler} />
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
  playlists: Playlist[],
  audioFiles: AudioFile[],
  selectedMediaType: string,
  searchValue: string,
  sortOrder: string
) {
  return playlists.concat(audioFiles);
}
