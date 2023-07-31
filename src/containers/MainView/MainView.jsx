import "./MainView.css";
import { SideBar } from "../../containers";
import { Home, Search, Library, LoginPage } from "../";
import { Navigate, Route, Routes } from "react-router-dom";

const MainView = () => {
  return (
    <section className="MainView">
      <SideBar />
      <Routes>
        <Route exact path="/" element={<Navigate to="/home" />} />
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/library" element={<Library />} />
        <Route path="/media/:mediaType/:mediaID" />
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </section>
  );
};

export default MainView;
