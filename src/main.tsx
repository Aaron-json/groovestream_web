import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthenticationContextProvider } from "./contexts/AuthenticationContext";
import { ColorContextProvider } from "./contexts/ColorContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
    },
  },
});
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthenticationContextProvider>
        <QueryClientProvider client={queryClient}>
          <ColorContextProvider>
            <App />
          </ColorContextProvider>
        </QueryClientProvider>
      </AuthenticationContextProvider>
    </BrowserRouter>
  </React.StrictMode>
);
