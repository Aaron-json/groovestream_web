import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthenticationContextProvider } from './contexts/AuthenticationContext'
import { ColorContextProvider } from "./contexts/ColorContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthenticationContextProvider>
    <BrowserRouter>
      <ColorContextProvider>
        <App />
      </ColorContextProvider>
    </BrowserRouter>
  </AuthenticationContextProvider>
);
