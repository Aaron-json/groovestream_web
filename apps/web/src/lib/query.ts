import { QueryClient } from "@tanstack/react-query";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      // Low enough to catch quick UI changes but not high enough to cause
      // meaningful data delay/lag
      // If more fine grained control is needed, queries should manually
      // invalidate and/or refresh data
      staleTime: 30_000,
    },
  },
});
