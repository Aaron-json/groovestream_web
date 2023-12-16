import "./Search.css";
import { SearchBar, MediaList } from "../../components";
import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

const Search = () => {
  const [searchValue, setSearchValue] = useState("");
  const [displayMedia, setDisplayMedia] = useState([]);

  return (
    <section className="search-page">
      <div className="search-page-header">
        <SearchBar
          value={searchValue}
          valueChangeHandler={setSearchValue}
          placeholder={"Search songs, artists, albums"}
        />
      </div>
      <hr />
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
