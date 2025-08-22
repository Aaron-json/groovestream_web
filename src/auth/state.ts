import { useRef, useCallback } from "react";
import axiosClient from "../api/axiosClient";
import { Session } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { supabaseClient } from "../auth/client";

const NO_INTERCEPTOR_ENDPOINTS = [
  {
    url: "/users",
    method: "post",
  },
];

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>();
  const sessionRef = useRef<Session | null>(null);

  const onSessionChange = useCallback((session: Session | null) => {
    sessionRef.current = session;
    setIsAuthenticated(!!session);
  }, []);
  useEffect(() => {
    // get the initial session
    const { data } = supabaseClient.auth.onAuthStateChange((_, session) => {
      onSessionChange(session);
    });

    // get initial session. will trigger onAuthStateChange
    supabaseClient.auth.getSession();

    // set interceptor to add auth header to requests
    axiosClient.interceptors.request.use(async (config) => {
      const token = await checkRequestAuth({
        url: config.url,
        method: config.method,
      });
      config.headers.Authorization = "Bearer " + token;
      return config;
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { sessionRef, isAuthenticated } as const;
}

// Abstract the auth checking. some endpoints like file upload use the fetch api and not axios.
// Returns an authorization header or undefined if the url is not meant to be
// intercepted. On error, throws an error.
export async function checkRequestAuth(config: {
  url?: string;
  method?: string;
}): Promise<string | undefined> {
  if (
    NO_INTERCEPTOR_ENDPOINTS.some(
      (url) =>
        url.url === config.url &&
        url.method.toLowerCase() === config.method?.toLowerCase(),
    )
  ) {
    return undefined;
  }

  const curSession = await supabaseClient.auth.getSession();

  if (curSession.error) {
    throw curSession.error;
  } else if (!curSession.data.session) {
    throw new Error("No session");
  } else {
    return curSession.data.session.access_token;
  }
}
