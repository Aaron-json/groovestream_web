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

    console.log("refreshing auth");
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
      console.log(error);
      setAuthenticated(false);
    }
  }
  async function logout() {
    // clear refresh token with a server request since
    // httpOnly cookies cannot be accessed through javascript
    try {
      request(async () => {
        await axiosClient.post("/user/logout", undefined, {
          headers: {
            Authorization: `Bearer ${accessTokenRef.current}`,
          },
        });
      });
      // clear the access token
      accessTokenRef.current = undefined;
      // set authenticated to false to update the ui
      await refreshAuthentication();
    } catch (err) {
      console.log(err);
    }
  }
  /**
   *
   * @param {Function} requestFunction - Async function that sends request to the backend.
   * If failed, it will try to grab a new access Token using the refreshAuthentication function and retry the request
   * @returns {Promise}
   */

  async function request(requestFunction) {
    try {
      return await requestFunction();
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        console.log(err);
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
        logout,
      }}
    >
      {children}
    </authenticationContext.Provider>
  );
};
