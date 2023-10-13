import { useState } from "react";
import "./Dropdown.css";
import { dropdown_icon } from "../../assets/default-icons";

interface DropdownProps {
  items: Array<string>;
  currentItemIndex: number;
  setCurrentItemIndex: (newValueIndex: number) => any;
}
const Dropdown = ({
  items,
  currentItemIndex,
  setCurrentItemIndex,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  function handleItemClick(item: number) {
    setCurrentItemIndex(item);
    setIsOpen(false);
  }
  return (
    <div className="dropdown">
      <button className="dropdown-toggle" onClick={() => setIsOpen(!isOpen)}>
        {items[currentItemIndex]}
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
              index !== currentItemIndex && (
                <li
                  key={index}
                  className="dropdown-item"
                  onClick={() => handleItemClick(index)}
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
