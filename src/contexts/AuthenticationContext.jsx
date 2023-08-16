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
  async function request(requestFunction) {
    console.log(
      "trying request\ntryig again\nokbto\nmfsfmdlksmdfvjsm\nnsofjdnsmldf"
    );

    try {
      return await requestFunction();
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        await refreshAuthentication();
        return await requestFunction();
      } else {
        throw err;
      }
    }
  }
  return (
    <authenticationContext.Provider
      value={{
        authenticated,
        setAuthenticated,
        refreshAuthentication,
        accessTokenRef,
        request,
      }}
    >
      {children}
    </authenticationContext.Provider>
  );
};
