import "./NavButton.css";
import { NavLink } from "react-router-dom";

interface SideButtonProps {
  text: string;
  icon: string;
  minimize?: boolean;
  // rotue to navigate to.
  // if not provided then use text as the route
  path?: string;
  navigate?: boolean;
  onClick?: () => any;
}
export default function SideButton(props: SideButtonProps) {
  if (props.navigate === true) {
    return <NavButton {...props} />;
  } else {
    return <ActionButton {...props} />;
  }
}
function NavButton(props: SideButtonProps) {
  let navRoute = props.path ? props.path : props.text;
  if (!props.navigate) return null;
  return (
    <NavLink
      to={`/${navRoute}`}
      className={({ isActive }) =>
        isActive ? "current-nav-entry" : "nav-entry"
      }
      onClick={props.onClick}
    >
      <SideButtonContent {...props} />
    </NavLink>
  );
}

function ActionButton(props: SideButtonProps) {
  return (
    // use anchor tag to have style parity with the navigation button
    // since navlink uses an underlying anchor tag
    <a className="nav-entry" onClick={props.onClick}>
      <SideButtonContent {...props} />
    </a>
  );
}
function SideButtonContent(props: Pick<SideButtonProps, "text" | "icon" | "minimize">) {
  return (
    <>
      <img className="nav-icon" src={props.icon} alt={props.text} />
      {!props.minimize && (
        <label className="nav-label">
          {props.text.charAt(0).toUpperCase() + props.text.slice(1)}
        </label>

      )}
    </>
  );
}
