import "./Search.css";
import { SearchBar, MediaList } from "../../components";
import { useEffect, useState } from "react";
// import { sample_results } from "../../sample_data";
import { debounced } from "../../api/requests";
import axiosClient from "../../api/axiosClient";

const Search = () => {
  const [searchValue, setSearchValue] = useState("");
  const [displayMedia, setDisplayMedia] = useState(null);

  useEffect(() => {
    // making requests to spotify
    if (searchValue === "") {
      setDisplayMedia(null);
      getRecentSeaches();
      return;
    } // Skip the effect if search query is empty
    return debounced(() => {
      console.log(`Sending request to Spotify: ${searchValue}`);
    }, 1000);
  }, [searchValue]);

  async function getRecentSeaches() {
    try {
      const response = await axiosClient.get("/user/recentSearches", {
        params: {
          // get the last 10 things searched
          limit: -10,
        },
      });
      setDisplayMedia(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  async function addRecentSearch(mediaType: string, mediaID: string) {
    // may change to post
    try {
      await axiosClient.post("user/recentSearches", {
        mediaID,
        mediaType,
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function deleteRecentSearch(mediaType: string, mediaID: string) {
    try {
      await axiosClient.delete("user/recentSearches", {
        params: {
          mediaType,
          mediaID,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <section className="search-page">
      <div className="search-page-header">
        <SearchBar
          value={searchValue}
          valueChangeHandler={setSearchValue}
          placeholder={"Search songs, artists, albums"}
        />
      </div>
      <hr className="search-header-bottom-line" />
      {displayMedia ? (
        <MediaList
          items={displayMedia}
          searchValue={searchValue}
          title="Search History"
        />
      ) : (
        <div className="loading-div">Loading...</div>
      )}
    </section>
  );
};

export default Search;
