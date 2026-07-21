import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import "./index.css";
import { routeTree } from "./routeTree.gen";
import { useAuth } from "./lib/auth";
import { TextLogo } from "./components/custom/textlogo";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/query";
import { userOptions } from "./query/user";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { TooltipProvider } from "./components/ui/tooltip";

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
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const auth = useAuth();
  const userId = auth.session?.user.id;

  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    ...userOptions(userId ?? ""),
    enabled: !!userId,
  });

  // Do not run route guards until the initial auth state is authoritative.
  if (!auth.isInitialized || (auth.isAuthenticated && userLoading)) {
    return (
      <section className="h-full flex justify-center items-center">
        <TextLogo />
      </section>
    );
  } else if (userError && auth.isAuthenticated) {
    return (
      <section className="h-full flex flex-col items-center p-4 gap-8">
        <div className="flex flex-none items-center justify-center h-28">
          <TextLogo />
        </div>
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              We're having trouble connecting to our servers. Please check your
              connection and try again.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }
  return (
    <RouterProvider router={router} context={{ auth, user: user ?? null }} />
  );
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}
