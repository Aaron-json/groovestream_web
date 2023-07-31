import "./Content.css";
import { useState } from "react";

const Content = () => {
  const [counter, setCounter] = useState(0);

  const increase = () => {
    setCounter((count) => count + 1);
  };
  const decrease = () => {
    setCounter((count) => count - 1);
  };
  const reset = () => {
    setCounter(0);
  };
  return (
    <div className="Content">
      <button onClick={increase}> + </button>
      <label> {counter} </label> <button onClick={decrease}> - </button>
      <button onClick={decrease}> - </button>
    </div>
  );
};
export default Content;
