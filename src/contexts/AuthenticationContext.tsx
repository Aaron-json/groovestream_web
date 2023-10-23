import React from "react";
import { createContext, useEffect, useRef, useState } from "react";
import axiosClient from "../api/axiosClient";
import { InternalAxiosRequestConfig } from "axios";
interface AuthenticationContextValue {
  authenticated: boolean | undefined;
  accessTokenRef: React.MutableRefObject<string>;
  request: (requestFunction: () => Promise<any>) => Promise<any>;
  login: (loginCredentials: LoginCredentials) => Promise<any>;
  logout: () => Promise<void>;
}
type LoginCredentials = {
  email: string;
  password: String;
};
export const authenticationContext = createContext<
  AuthenticationContextValue | undefined
>(undefined);

const NO_RETRY_URLS = new Set(["/login", "/refresh", "/logout"]);
export const AuthenticationContextProvider = ({
  children,
}: ContextProvider) => {
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
      const refreshResponse = await axiosClient.get("/refresh");
      const { accessToken } = refreshResponse.data;
      accessTokenRef.current = accessToken;
      setAuthenticated(true);
    } catch (error) {
      // failed to authenticate
      setAuthenticated(false);
    }
  }

  interface CustomRequestConfig extends InternalAxiosRequestConfig {
    _retry: boolean;
  }
  function setAuthRequestInterceptor() {
    axiosClient.interceptors.request.use((config: CustomRequestConfig) => {
      config.headers.Authorization = `Bearer ${accessTokenRef.current}`;
      if (config._retry === undefined && !NO_RETRY_URLS.has(config.url)) {
        config._retry = true;
      }
      return config;
    });
  }

  function setAuthResponseInterceptor() {
    axiosClient.interceptors.response.use(undefined, async (error) => {
      const { config, response } = error;
      if (
        (response?.status === 401 || response?.status === 403) &&
        config._retry
      ) {
        config._retry = false;
        await __getAccessToken();
        try {
          // this time with a new access token if the refresh token
          // was still valid
          return axiosClient(config);
        } catch (retryError) {
          return Promise.reject(error);
        }
      } else {
        return Promise.reject(error);
      }
    });
  }

  async function login(loginCredentials: LoginCredentials) {
    try {
      const loginResponse = await axiosClient.post(
        "user/login",
        loginCredentials
      );
      const { accessToken } = loginResponse.data;
      // update authentication state
      accessTokenRef.current = accessToken;
      setAuthenticated(true);
    } catch (error) {
      console.log(error);
    }
  }
  async function logout() {
    // clear refresh token with a server request since
    // httpOnly cookies cannot be accessed through javascript
    try {
      await axiosClient.post("user/logout");
      // clear the access token
      accessTokenRef.current = "";
      // set authenticated to false to update the ui
      setAuthenticated(false);
    } catch (err) {
      console.log(err);
    }
  }

  type requestFunctionType = () => Promise<any>;
  /**
   *
   * @param {Function} requestFunction - Async function that sends request to the backend.
   * If failed, it will try to grab a new access Token using the refreshAuthentication function and retry the request
   * @returns {Promise}
   */
  async function request(requestFunction: requestFunctionType) {
    try {
      return await requestFunction();
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        console.log(err);
        await __getAccessToken();
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
        accessTokenRef,
        request,
        login,
        logout,
      }}
    >
      {children}
    </authenticationContext.Provider>
  );
};
