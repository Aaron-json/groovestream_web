import "./SideBar.css";
import { NavButton } from "../../components";
import {
  menu_icon,
  home_icon,
  search_icon,
  library_icon,
  about_icon,
  settings_icon,
} from "../../assets/default-icons/SideBar";
import { social_icon } from "../../assets/default-icons/SideBar";

// side navigation buttons and their icons
export default function SideBar() {
  return (
    <section className="SideBar">
      <NavButton text="menu" icon={menu_icon} />
      <hr className="menu-nav-separator" />
      <div className="nav-buttons">
        <NavButton text="home" icon={home_icon} />
        <NavButton text="search" icon={search_icon} />
        <NavButton text="library" icon={library_icon} />
        <NavButton text="social" icon={social_icon} />
      </div>
      <div className="info-sideButtons">
        <NavButton text="about" icon={about_icon} />
        <NavButton text="settings" icon={settings_icon} />
      </div>
    </section>
  );
}
