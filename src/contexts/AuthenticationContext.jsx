import { createContext, useEffect, useRef, useState } from "react";
import axiosClient from "../api/axiosClient";

export const authenticationContext = createContext();

export const AuthenticationContextProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState();
  const accessTokenRef = useRef();
  // const [refreshToken, setRefreshToken] = useState()
  // persist refresh token in local storage

  useEffect(() => {
    refreshAuthentication();
  }, []);

  async function refreshAuthentication() {
    // checks if you have any refresh tokens
    // if you do, gets new access tokens

    try {
      const refreshResponse = await axiosClient.get("/refresh", {
        // include http only cookie with refresh token
        withCredentials: true,
      });
      const { accessToken } = refreshResponse.data;
      accessTokenRef.current = accessToken;
      setAuthenticated(true);
    } catch (error) {
      // failed to authenticate
      setAuthenticated(false);
    }
  }

  return (
    <authenticationContext.Provider
      value={{
        authenticated,
        setAuthenticated,
        refreshAuthentication,
        accessTokenRef,
      }}
    >
      {children}
    </authenticationContext.Provider>
  );
};
