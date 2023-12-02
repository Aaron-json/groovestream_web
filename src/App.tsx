// import logo from './logo.svg';
import { useContext } from "react";
import "./App.css";
import { MainView, MediaBar, LoginPage, RegistrationPage } from "./containers";
import { MediaContextProvider } from "./contexts/MediaContext";
import { Routes, Route, Navigate } from "react-router-dom";
import { authenticationContext } from "./contexts/AuthenticationContext";
import { AppHeader, LoadingSpinnerDiv } from "./components";
import { colorContext } from "./contexts/ColorContext";

export default function App() {
  const { authenticated } = useContext(authenticationContext)!;
  const { color } = useContext(colorContext)!;

  return (
    <>
      {authenticated === true && (
        <div
          id="App"
          style={{
            background: color,
          }}
        >
          <MediaContextProvider>
            <MainView />
            <MediaBar />
          </MediaContextProvider>
        </div>
      )}

      {authenticated === false && (
        <div className="login-register">
          <AppHeader />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegistrationPage />} />
            {/* All other paths lead to login page if not authenticated */}
            <Route path="*" element={<Navigate to="/login" />}></Route>
          </Routes>
        </div>
      )}

      {authenticated === undefined && (
        <LoadingSpinnerDiv
          style={{
            backgroundColor: "black",
          }}
        />
      )}
    </>
  );
}
