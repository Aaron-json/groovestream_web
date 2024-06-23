import React from "react";
import { createContext, useEffect, useRef, useState } from "react";
import axiosClient from "../api/axiosClient";
import { InternalAxiosRequestConfig } from "axios";
import { ContextProviderProps } from "./types";
type AuthenticationContextValue = {
  authenticated: boolean | undefined;
  accessTokenRef: React.MutableRefObject<string>;
  login: (loginCredentials: LoginCredentials) => Promise<any>;
  logout: () => Promise<void>;
};
type LoginCredentials = {
  username: string;
  password: String;
};
const NO_RETRY_URLS = new Set(["auth/login", "auth/refresh", "auth/logout"]);
export const authenticationContext = createContext<
  AuthenticationContextValue | undefined
>(undefined);

export const AuthenticationContextProvider = ({
  children,
}: ContextProviderProps) => {
  const [authenticated, setAuthenticated] = useState<boolean | undefined>(
    undefined
  );
  const accessTokenRef = useRef<string>("");
  // const [refreshToken, setRefreshToken] = useState()
  // persist refresh token in local storage

  useEffect(() => {
    onAuthLoad();
  }, []);

  async function onAuthLoad() {
    setAuthRequestInterceptor();
    setAuthResponseInterceptor();
    await __getAccessToken();
  }
  async function __getAccessToken() {
    // sends a request to the server for a new access token,
    // if you have a valid refresh token, you get a new access tokens
    try {
      const refreshResponse = await axiosClient.get("auth/refresh");
      const { accessToken } = refreshResponse.data;
      accessTokenRef.current = accessToken;
      setAuthenticated(true);
    } catch (error) {
      // failed to authenticate
      setAuthenticated(false);
    }
  }

  interface CustomRequestConfig extends InternalAxiosRequestConfig {
    // starts with _ to avoid naming clashes
    _retry?: boolean;
  }
  function setAuthRequestInterceptor() {
    axiosClient.interceptors.request.use((config: CustomRequestConfig) => {
      config.headers.Authorization = `Bearer ${accessTokenRef.current}`;
      if (
        config._retry === undefined &&
        config.url &&
        !NO_RETRY_URLS.has(config.url)
      ) {
        config._retry = true;
      }
      return config;
    });
  }

  function setAuthResponseInterceptor() {
    axiosClient.interceptors.response.use(undefined, async (error) => {
      const { config, response } = error;
      if (response?.status !== 401 || !config._retry) {
        return Promise.reject(error);
      }
      config._retry = false;
      await __getAccessToken();
      try {
        // this time with a new access token if the refresh token
        // was still valid
        return axiosClient(config);
      } catch (retryError) {
        return Promise.reject(error);
      }
    });
  }

  async function login(loginCredentials: LoginCredentials) {
    const loginResponse = await axiosClient.post(
      "auth/login",
      loginCredentials
    );
    const { accessToken } = loginResponse.data;
    // update authentication state
    accessTokenRef.current = accessToken;
    setAuthenticated(true);
  }
  async function logout() {
    // clear refresh token with a server request since
    // httpOnly cookies cannot be accessed through javascript
    try {
      await axiosClient.post("auth/logout");
      // clear the access token
      accessTokenRef.current = "";
      // set authenticated to false to update the ui
      setAuthenticated(false);
    } catch (err) { }
  }

  return (
    <authenticationContext.Provider
      value={{
        authenticated,
        accessTokenRef,
        login,
        logout,
      }}
    >
      {children}
    </authenticationContext.Provider>
  );
};
