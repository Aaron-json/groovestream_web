import { useRef, useCallback } from "react";
import axiosClient from "../api/axiosClient";
import { Session } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Route as AuthRoute } from "@/routes/auth";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anon_key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabaseClient = createClient(supabaseUrl, anon_key);

export async function signInGoogle() {
  const location = `${window.location.origin}/${AuthRoute.path}`;

  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: location,
      queryParams: {
        prompt: "select_account",
      },
    },
  });
  if (error) {
    throw error;
  }
}

export async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    throw error;
  }
  window.location.reload();
}

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
      const token = await checkRequestAuth();
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
export async function checkRequestAuth(): Promise<string | undefined> {
  const curSession = await supabaseClient.auth.getSession();

  if (curSession.error) {
    throw curSession.error;
  } else if (!curSession.data.session) {
    throw new Error("No session");
  } else {
    return curSession.data.session.access_token;
  }
}
