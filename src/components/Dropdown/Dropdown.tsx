import React, { useState } from "react";
import "./Dropdown.css";
import { dropdown_icon } from "../../assets/default-icons";

interface DropdownProps {
  items: Array<string>;
  currentItem: string;
  setCurrentItem: React.Dispatch<React.SetStateAction<string>>;
}
const Dropdown = ({ items, currentItem, setCurrentItem }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  function handleItemClick(item: string) {
    setCurrentItem(item);
    setIsOpen(false);
  }
  return (
    <div className="dropdown">
      <button className="dropdown-toggle" onClick={() => setIsOpen(!isOpen)}>
        {currentItem}
        <img
          src={dropdown_icon}
          alt="img"
          style={{
            rotate: isOpen ? "180deg" : "0deg",
          }}
        />
      </button>
      {isOpen && (
        <ul className="dropdown-menu">
          {items.map(
            (item, index) =>
              item !== currentItem && (
                <li
                  key={index}
                  className="dropdown-item"
                  onClick={() => handleItemClick(item)}
                >
                  {item}
                </li>
              )
          )}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
