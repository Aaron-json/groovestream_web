import { RouterProvider } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { userOptions } from "@groovestream/query/user";
import { router } from "./router";
import { useAuth } from "./lib/auth";
import { TextLogo } from "./components/custom/textlogo";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";

export function App() {
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
