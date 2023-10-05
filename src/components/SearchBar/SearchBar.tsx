import "./SearchBar.css";

export default function SearchBar({ value, valueChangeHandler, placeholder }) {
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
