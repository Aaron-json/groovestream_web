import { createFileRoute, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signInGoogle } from "@/lib/auth";
import { TextLogo } from "@/components/custom/textlogo";
import { CloudUpload, MusicIcon, UsersIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

export const Route = createFileRoute("/auth")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: "/",
      });
    }
  },
});

export default function RouteComponent() {
  const [signInError, setSignInError] = useState<string>();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSignInError(undefined);
    setIsSigningIn(true);

    try {
      await signInGoogle(
        new URL(Route.fullPath, window.location.origin).toString(),
      );
    } catch {
      setSignInError("Unable to start Google sign-in. Please try again.");
      setIsSigningIn(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-full">
      <div className="flex flex-col justify-center px-6 py-12 lg:px-16 lg:py-20 bg-secondary/40 lg:flex-1">
        <div className="max-w-xl mx-auto lg:mx-0">
          <div className="mb-8">
            <TextLogo />
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-foreground">
            Listen together, anywhere
          </h1>

          <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-10">
            Create collaborative playlists, sync playback with friends, and turn
            your music library into a shared experience.
          </p>

          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-secondary border flex items-center justify-center">
                <MusicIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Build your collection
                </h3>
                <p className="text-sm text-muted-foreground">
                  Craft playlists that capture the perfect mood and share them
                  with the people who matter
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-secondary border flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Listen together in sync
                </h3>
                <p className="text-sm text-muted-foreground">
                  Real-time playback means you and your crew hear the same beat
                  at the same moment
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-secondary border flex items-center justify-center">
                <CloudUpload className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Your music, everywhere
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upload your tracks and access your entire collection from any
                  device
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12 lg:py-20 bg-background lg:flex-1">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-primary/10">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center">
                Get started
              </CardTitle>
              <p className="text-center text-sm text-muted-foreground">
                Sign in to start creating and sharing
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                size="lg"
                className="w-full flex items-center justify-center gap-3 h-10"
                onClick={handleSignIn}
                disabled={isSigningIn}
              >
                <FcGoogle className="w-5 h-5" />
                <span className="font-medium">
                  {isSigningIn ? "Connecting…" : "Continue with Google"}
                </span>
              </Button>
              {signInError && (
                <Alert variant="destructive">
                  <AlertDescription>{signInError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            New here? Your account will be created automatically
          </p>
        </div>
      </div>
    </div>
  );
}
