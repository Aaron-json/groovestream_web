import { createRouter } from "@tanstack/react-router";
import { configureApiClient } from "@groovestream/api/client";
import { PRIMARY_API_URL } from "./api/api";
import { getAuthToken } from "./lib/supabase";
import { routeTree } from "./routeTree.gen";

configureApiClient({ baseUrl: PRIMARY_API_URL, getAccessToken: getAuthToken });

// Create a root router instance
export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
    user: undefined!,
  },
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
