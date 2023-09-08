import "./Dialog.css";
export default function Dialog({ show, children }) {
  if (!show) return null;
  return <div className="dialog">{children}</div>;
}
