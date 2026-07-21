import axiosClient from "../api/api";
import { Session } from "@supabase/supabase-js";
import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Route as AuthRoute } from "@/routes/auth";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { queryClient } from "@/lib/query";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anon_key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabaseClient = createClient(supabaseUrl, anon_key);

// Returns an authentication token. If the user is not authenticated, throws an error.
async function getAuthToken(): Promise<string | undefined> {
  const curSession = await supabaseClient.auth.getSession();

  if (curSession.error) {
    throw curSession.error;
  } else if (!curSession.data.session) {
    throw new Error("No session");
  } else {
    return curSession.data.session.access_token;
  }
}

// attack auth interceptor to axiosClient for
axiosClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  config.headers.Authorization = "Bearer " + token;
  return config;
});

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

type AuthState = {
  session: Session | null;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
};

// Private internal store for auth state
const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isInitialized: false,
  setSession: (session) =>
    set({
      session,
      isInitialized: true,
    }),
}));

let authSubscriptionStarted = false;
let authenticatedUserId: string | null | undefined;

// Initiates the auth state subscription. Only needs to run once.
function startAuthSubscription() {
  if (authSubscriptionStarted) return;
  authSubscriptionStarted = true;

  // helper to set the auth state in the store
  const setSession = (session: Session | null) => {
    const nextUserId = session?.user.id ?? null;

    // Clear cache whenever the user identity changes.
    if (
      authenticatedUserId !== undefined &&
      authenticatedUserId !== nextUserId
    ) {
      queryClient.clear();
    }

    authenticatedUserId = nextUserId;

    useAuthStore.getState().setSession(session);
  };

  const {
    data: { subscription },
  } = supabaseClient.auth.onAuthStateChange((_, session) => {
    setSession(session);
  });

  // handle hot reloads since we do not unsubscribe
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      subscription.unsubscribe();
      authSubscriptionStarted = false;
    });
  }
}

// Hook for accessing/reacting to the auth state.
// Auth state is never unsubscribed from since it is a singleton
// that lasts for the lifetime of the application.
export function useAuth() {
  useEffect(startAuthSubscription, []);

  return useAuthStore(
    useShallow((state) => ({
      session: state.session,
      isInitialized: state.isInitialized,
      isAuthenticated: state.session !== null,
    })),
  );
}
