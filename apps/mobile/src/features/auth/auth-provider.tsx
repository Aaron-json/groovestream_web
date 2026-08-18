import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { AppState } from "react-native";
import { queryClient } from "@/lib/query";
import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  session: Session | null;
  initialized: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function paramsFromCallback(url: string) {
  const parsed = new URL(url);
  const query = new URLSearchParams(parsed.search);
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  return new URLSearchParams([...query.entries(), ...hash.entries()]);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const previousUserId = useRef<string | null | undefined>(undefined);

  const updateSession = useCallback((next: Session | null) => {
    const nextUserId = next?.user.id ?? null;
    if (
      previousUserId.current !== undefined &&
      previousUserId.current !== nextUserId
    ) {
      queryClient.clear();
    }
    previousUserId.current = nextUserId;
    setSession(next);
    setInitialized(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (mounted) updateSession(error ? null : data.session);
      })
      .catch(() => {
        if (mounted) updateSession(null);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      updateSession(next);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [updateSession]);

  useEffect(() => {
    const updateRefresh = (state: string) => {
      if (state === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    };
    updateRefresh(AppState.currentState);
    const subscription = AppState.addEventListener("change", updateRefresh);
    return () => {
      subscription.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = Linking.createURL("auth/callback", {
      scheme: "groovestream",
    });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) throw error;
    if (!data.url) throw new Error("Google sign-in could not be started");

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success") return;

    const params = paramsFromCallback(result.url);
    const callbackError =
      params.get("error_description") ?? params.get("error_code");
    if (callbackError) throw new Error(callbackError);

    const code = params.get("code");
    if (!code) throw new Error("Google sign-in returned no authorization code");

    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo(
    () => ({ session, initialized, signInWithGoogle, signOut }),
    [initialized, session, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
