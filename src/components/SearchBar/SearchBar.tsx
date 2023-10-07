import "./SearchBar.css";

interface SearchBarProps {
  value: string;
  valueChangeHandler: (newValue: string) => any;
  placeholder: string;
}
export default function SearchBar({
  value,
  valueChangeHandler,
  placeholder,
}: SearchBarProps) {
  return (
    <input
      className="search-bar"
      value={value}
      type="text"
      placeholder={placeholder}
      onChange={(e) => valueChangeHandler(e.target.value)}
    />
  );
}
