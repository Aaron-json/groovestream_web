import "./NavButton.css";
import { navButtons, infoButtons } from "../../containers/SideBar/SideBar";
import {NavLink} from "react-router-dom";

const SideButton = (props) => {
  return (
    // anchor to add router support
    <>
      {props.text in navButtons && (
        <NavButton text={props.text} icon={props.icon} />
      )}
      {props.text in infoButtons && (
        <InfoButton text={props.text} icon={props.icon} />
      )}
      {props.text === "menu" && (
        <InfoButton text={props.text} icon={props.icon} />
      )}
    </>
  );
};

function NavButton(props) {

  return (
    <NavLink to={`/${props.text}`}
             className= {({isActive}) => isActive ? 'current-nav-entry' : 'nav-entry'}
    >
      <img className="nav-icon" src={props.icon} alt={props.text} />
      <label className="nav-label">
        {props.text.charAt(0).toUpperCase() + props.text.slice(1)}
      </label>
    </NavLink>
  );
}

function InfoButton(props) {
  return (
    <a className="info-nav-entry" onClick={() => {}}>
      <img className="nav-icon" src={props.icon} alt={props.text} />
      <label className="nav-label">
        {props.text.charAt(0).toUpperCase() + props.text.slice(1)}
      </label>
    </a>
  );
}

function toggleMenu(props) {
  return (
    <a className="info-nav-entry" onClick={() => {}}>
      <img className="nav-icon" src={props.icon} alt={props.text} />
      <label className="nav-label">
        {props.text.charAt(0).toUpperCase() + props.text.slice(1)}
      </label>
    </a>
  );
}

export default SideButton;
