import "./Search.css";
import { SearchBar, Dropdown, MediaList } from "../../components";
import { useContext, useEffect, useState } from "react";
// import { sample_results } from "../../sample_data";
import { debounced, retryRequest } from "../../api/requests";
import axiosClient from "../../api/axiosClient";
import { authenticationContext } from "../../contexts/AuthenticationContext";

const Search = () => {
  const { accessTokenRef, refreshAuthentication } = useContext(
    authenticationContext
  );
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
    const response = await retryRequest(async () => {
      return await axiosClient.get("/user/recentSearches", {
        headers: {
          Authorization: `Bearer ${accessTokenRef.current}`,
        },
        params: {
          // get the last 10 things searched
          limit: -10,
        },
      });
    }, refreshAuthentication);
    console.log(response);
    setDisplayMedia(response.data);
  }

  async function addRecentSearch(mediaType, mediaID) {
    const response = await retryRequest(async () => {
      // may change to post
      return await axiosClient.post(
        "user/recentSearches",
        {
          mediaID,
          mediaType,
        },
        {
          headers: {
            Authorization: `Bearer ${accessTokenRef.current}`,
          },
        }
      );
    }, refreshAuthentication);
  }

  async function deleteRecentSearch(mediaType, mediaID) {
    const response = await retryRequest(async () => {
      return await axiosClient.delete("user/recentSearches", {
        headers: {
          Authorization: `Bearer ${accessTokenRef.current}`,
        },
        params: {
          mediaType,
          mediaID,
        },
      });
    });
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
