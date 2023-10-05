import React from "react"
import "./Dialog.css";

interface DialogProps {
  show: boolean,
  children: React.ReactNode
}
export default function Dialog({ show, children }: DialogProps) {
  if (!show) return null;
  return <div className="dialog">{children}</div>;
}
