import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { AuthProvider } from "@/features/auth/auth-provider";
import { PlaybackProvider } from "@/features/media/playback-provider";
import { queryClient } from "@/lib/query";
import { QueryLifecycle } from "./query-lifecycle";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GluestackUIProvider>
      <QueryClientProvider client={queryClient}>
        <QueryLifecycle>
          <AuthProvider>
            <PlaybackProvider>{children}</PlaybackProvider>
          </AuthProvider>
        </QueryLifecycle>
      </QueryClientProvider>
    </GluestackUIProvider>
  );
}
