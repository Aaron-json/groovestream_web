import React from "react";
import "./SideBar.css";
import { NavButton } from "../../components";
import {
  menu_icon,
  home_icon,
  search_icon,
  library_icon,
  about_icon,
  settings_icon,
} from "./default-icons";

// side navigation buttons and their icons
export const navButtons:any = {
  home: home_icon,
  search: search_icon,
  library: library_icon,
};
export const infoButtons:any = {
  about: about_icon,
  settings: settings_icon,
};
export default function SideBar() {
  return (
    <section className="SideBar">
      <NavButton text="menu" icon={menu_icon} />
      <hr className="menu-nav-separator" />
      <div className="nav-buttons">
        {Object.keys(navButtons).map((navLabel) => {

          return (
            <NavButton
              key={navLabel}
              icon={navButtons[navLabel]}
              text={navLabel}
            />
          );
        })}
      </div>
      <div className="info-sideButtons">
        {Object.keys(infoButtons).map((infoLabel) => (
          <NavButton
            key={infoLabel}
            text={infoLabel}
            icon={infoButtons[infoLabel]}
          />
        ))}
      </div>
    </section>
  );
}
