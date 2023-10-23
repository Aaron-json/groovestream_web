import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthenticationContextProvider } from "./contexts/AuthenticationContext";
import { ColorContextProvider } from "./contexts/ColorContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthenticationContextProvider>
          <ColorContextProvider>
            <App />
          </ColorContextProvider>
        </AuthenticationContextProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
