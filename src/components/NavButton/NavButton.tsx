import "./NavButton.css";
import { NavLink } from "react-router-dom";

interface SideButtonProps {
  text: string;
  icon: string;
}
const SideButton = (props: SideButtonProps) => {
  return <NavButton text={props.text} icon={props.icon} />;
};

function NavButton(props: SideButtonProps) {
  return (
    <NavLink
      to={`/${props.text}`}
      className={({ isActive }) =>
        isActive ? "current-nav-entry" : "nav-entry"
      }
    >
      <img className="nav-icon" src={props.icon} alt={props.text} />
      <label className="nav-label">
        {props.text.charAt(0).toUpperCase() + props.text.slice(1)}
      </label>
    </NavLink>
  );
}
function InfoButton(props: SideButtonProps) {
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
