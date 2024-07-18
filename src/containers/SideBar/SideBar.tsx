import "./SideBar.css";
import { NavButton } from "../../components";
import {
  menu_icon,
  home_icon,
  library_icon,
  logout_icon,
} from "../../assets/default-icons/SideBar";
import { social_icon } from "../../assets/default-icons/SideBar";
import { supabaseClient } from "../../App";

export default function SideBar() {
  return (
    <section className="SideBar">
      <NavButton text="menu" icon={menu_icon} />
      <hr className="menu-nav-separator" />
      <div className="nav-buttons">
        <NavButton text="home" navigate icon={home_icon} />
        <NavButton text="library" navigate icon={library_icon} />
        <NavButton text="social" navigate icon={social_icon} />
      </div>
      <div className="info-sideButtons">
        <NavButton text="logout" icon={logout_icon} onClick={() => supabaseClient.auth.signOut()} />
      </div>
    </section>
  );
}
