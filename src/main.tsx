import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import "./index.css";
import { routeTree } from "./routeTree.gen";
import { useAuth } from "./lib/auth";
import TextLogo from "./components/custom/textlogo";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { getUser } from "./api/requests/user";
import { queryClient } from "./lib/query";
import { AxiosError } from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";

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

  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ["user-exists"],
    queryFn: async () => {
      try {
        return await getUser();
      } catch (error) {
        if (error instanceof AxiosError && error.status === 404) {
          return null;
        } else {
          throw error;
        }
      }
    },
    staleTime: Infinity,
  });

  // handles initial loading state
  if (auth.isAuthenticated === undefined || userLoading) {
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
        <Card className="w-full max-w-md">
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
  return <RouterProvider router={router} context={{ auth, user }} />;
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}
