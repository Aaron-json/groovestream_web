import React from "react";
import { createContext, useContext, useEffect, useState } from "react";

export const DEFAULT_COLOR : string=
  "linear-gradient(to top right,rgb(15, 32, 39),rgb(32, 58, 67),rgb(44, 83, 100))";
const GRADIENT_START : string = "rgb(15, 32, 39)";
const GRADIENT_END : string = "rgb(44, 83, 100)";
interface ColorContextValue {
  color: string,
  updateColor: (newColor:string) => void
}
export const colorContext = createContext<ColorContextValue | undefined>(undefined);
export const ColorContextProvider:React.FC<ContextProvider> = ({ children }) => {
  const [color, setColor] = useState(DEFAULT_COLOR);

  function updateColor(newColor : string) {
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
