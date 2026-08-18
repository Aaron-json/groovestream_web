import { Session } from "@supabase/supabase-js";
import { useEffect } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { queryClient } from "@/lib/query";
import { supabaseClient } from "@/lib/supabase";

export async function signInGoogle(redirectTo: string) {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
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
