import "./MainView.css";
import { PlaylistPage, SideBar } from "..";
import { Home, Search, Library } from "..";
import { Navigate, Route, Routes } from "react-router-dom";

const MainView = () => {
  return (
    <section className="MainView">
      <SideBar />
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/library" element={<Library />} />
        <Route path="/media/1/:mediaID" element={<PlaylistPage />} />
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </section>
  );
};

export default MainView;
