import "./Modal.css";
import { useRef, useEffect } from "react";
export default function Modal({ children, type, show, onClose }) {
  const modalRef = useRef();
  useEffect(() => {
    if (!modalRef.current) {
      return;
    }
    if (show) {
      modalRef.current.showModal();
    } else {
      modalRef.current.close();
    }
  }, [show]);

  if (!show) return null;
  return (
    <dialog ref={modalRef} className="modal">
      {children}
      <button className="close-modal-btn" onClick={onClose}>
        Close
      </button>
    </dialog>
  );
}
