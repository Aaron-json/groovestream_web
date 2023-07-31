import React, { useContext } from "react";
import { colorContext } from "../../contexts/ColorContext";

const Modal = () => {
  const { color } = useContext(colorContext);

  return (
    <div
      className="modal"
      style={{
        background: color,
      }}
    >
      Modal
    </div>
  );
};

export default Modal;
