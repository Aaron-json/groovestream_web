import { useRef, useCallback } from "react";
import axiosClient from "../api/axiosClient";
import { Session } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { supabaseClient } from "../auth/client";

const NO_INTERCEPTOR_URLS = [
  {
    // do not intercept requests to supabase auth endpoints
    url: "/users",
    method: "post",
  },
];

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>();
  const sessionRef = useRef<Session | null>(null);

  const onSessionChange = useCallback(
    (session: Session | null) => {
      sessionRef.current = session;
      setIsAuthenticated(!!session);
    },
    [isAuthenticated],
  );
  useEffect(() => {
    // get the initial session
    const { data } = supabaseClient.auth.onAuthStateChange((_, session) => {
      onSessionChange(session);
    });

    // get initial session. will trigger onAuthStateChange
    supabaseClient.auth.getSession();

    // set interceptor to add auth header to requests
    axiosClient.interceptors.request.use(async (config) => {
      if (
        NO_INTERCEPTOR_URLS.some(
          (url) =>
            url.url === config.url &&
            url.method.toLowerCase() === config.method?.toLowerCase(),
        )
      ) {
        return config;
      }

      const curSession = await supabaseClient.auth.getSession();

      if (curSession.error) {
        throw curSession.error;
      } else if (!curSession.data.session) {
        throw new Error("No session");
      } else {
        config.headers.Authorization =
          "Bearer " + curSession.data.session.access_token;
      }
      return config;
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { sessionRef, isAuthenticated } as const;
}
