import { focusManager, onlineManager } from "@tanstack/react-query";
import * as Network from "expo-network";
import { useEffect, type PropsWithChildren } from "react";
import { AppState } from "react-native";

export function QueryLifecycle({ children }: PropsWithChildren) {
  useEffect(() => {
    focusManager.setFocused(AppState.currentState === "active");
    const subscription = AppState.addEventListener("change", (state) => {
      focusManager.setFocused(state === "active");
    });
    return () => subscription.remove();
  }, []);

  useEffect(
    () =>
      onlineManager.setEventListener((setOnline) => {
        void Network.getNetworkStateAsync()
          .then((state) => {
            setOnline(state.isConnected !== false);
          })
          .catch(() => {
            // The change listener below remains the source of future updates.
          });
        const subscription = Network.addNetworkStateListener((state) => {
          setOnline(state.isConnected !== false);
        });
        return () => subscription.remove();
      }),
    [],
  );

  return children;
}
