import { createContext, useContext, useEffect, useState } from "react";

export const DEFAULT_COLOR =
  "linear-gradient(to top right,rgb(15, 32, 39),rgb(32, 58, 67),rgb(44, 83, 100))";
const GRADIENT_START = "rgb(15, 32, 39)";
const GRADIENT_END = "rgb(44, 83, 100)";

export const colorContext = createContext(DEFAULT_COLOR);

export const ColorContextProvider = ({ children }) => {
  const [color, setColor] = useState(DEFAULT_COLOR);

  function updateColor(newColor) {
    // change its styles
    const colorTemplate = `linear-gradient(to right, ${GRADIENT_START}, ${newColor}, ${GRADIENT_END})`;
    setColor(colorTemplate);
  }
  useEffect(() => {
    setColor("--default-background");
  }, []);

  return (
    <colorContext.Provider value={{ color, updateColor }}>
      {children}
    </colorContext.Provider>
  );
};
