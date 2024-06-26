import "./MainView.css";
import { PlaylistPage, SideBar, SocialPage } from "..";
import { Home, Search, Library } from "..";
import { Navigate, Route, Routes } from "react-router-dom";
import { MediaType } from "../../types/media";

const MainView = () => {
  return (
    <section className="MainView">
      <SideBar />
      <Routes>
        <Route index element={<Navigate to="/home" />} />
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/library">
          <Route index element={<Library />} />
          <Route
            path={`media/${MediaType.Playlist}/:mediaID`}
            element={<PlaylistPage />}
          />
          <Route path="*" element={<Navigate to="/library" />} />
        </Route>
        <Route path="/social" element={<SocialPage />} />
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </section>
  );
};

export default MainView;
