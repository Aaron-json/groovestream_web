import { OverlayProvider } from "@gluestack-ui/core/overlay/creator";
import { ToastProvider } from "@gluestack-ui/core/toast/creator";
import type { PropsWithChildren } from "react";
import { View } from "react-native";

export function GluestackUIProvider({ children }: PropsWithChildren) {
  return (
    <View className="flex-1 bg-background">
      <OverlayProvider>
        <ToastProvider>{children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
