import { useEffect, useRef, useState } from "react";
import "./SearchBar.css";

const DEFAULT_DEBOUNCE_TIMER = 800; // ms
interface SearchBarProps {
  value: string;
  valueChangeHandler: (newValue: string) => any;
  placeholder: string;
  debounce: true;
  // default is used if not provided
  debounceTimer?: number;
}
export default function SearchBar({
  value,
  valueChangeHandler,
  placeholder,
  debounceTimer,
}: SearchBarProps) {
  const [_value, _setValue] = useState(value);
  const firstRender = useRef<boolean>(true);
  useEffect(() => {
    // in development react renders twice on mount causing
    // the  timeout to run on the second render so it is expected to malfunction.
    // In production or without strictmode however, this component works as expected
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      valueChangeHandler(_value);
    }, debounceTimer || DEFAULT_DEBOUNCE_TIMER);
    return () => clearTimeout(timeout);
  }, [_value]);
  return (
    <input
      className="search-bar"
      value={_value}
      type="text"
      placeholder={placeholder}
      onChange={(e) => _setValue(e.target.value)}
    />
  );
}
