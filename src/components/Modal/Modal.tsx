import "./Modal.css";
import React, { useRef, useLayoutEffect } from "react";

interface ModalProps {
  show: boolean;
  onClose: () => any;
  children: React.ReactNode;
}
export default function Modal({ show, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDialogElement | null>(null);

  useLayoutEffect(() => {
    if (!modalRef.current) {
      return;
    }
    if (show) {
      // open modal and add event listener for close event
      // when modal closes outside of state change, the state will still be appropriately handled
      modalRef.current.showModal();
      modalRef.current.addEventListener("close", onClose);
    } else {
      // remove event listener then close modal
      modalRef.current.removeEventListener("close", onClose);
      modalRef.current.close();
    }
  }, [show]);

  function handleClose() {
    if (onClose) {
      onClose();
    }
  }
  // do not render component
  if (!show) return null;

  return (
    <dialog ref={modalRef} className="modal">
      {children}
      <button className="close-modal-btn" onClick={handleClose}>
        Close
      </button>
    </dialog>
  );
}
