// import logo from './logo.svg';
import { useContext } from "react";
import "./App.css";
import { MainView, MediaBar, LoginPage, RegistrationPage } from "./containers";
import { MediaContextProvider } from "./contexts/MediaContext";
import { TasksContextProvider } from "./contexts/TasksContext";
import { Routes, Route, Navigate } from "react-router-dom";
import { authenticationContext } from "./contexts/AuthenticationContext";
import { AppHeader, LoadingSpinnerDiv } from "./components";

export default function App() {
  const { authenticated } = useContext(authenticationContext)!;

  return (
    <>
      {authenticated === true && (
        <div id="App">
          <TasksContextProvider>
            <MediaContextProvider>
              <MainView />
              <MediaBar />
            </MediaContextProvider>
          </TasksContextProvider>
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
