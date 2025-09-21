import { createFileRoute, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signInGoogle } from "@/lib/auth";
import TextLogo from "@/components/custom/textlogo";

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
  return (
    <div className="flex flex-row w-full h-full">
      {/* Left side - Hero / App intro */}
      <div className="flex flex-row flex-1 lg:flex-col justify-center px-12 bg-secondary/30 text-card-foreground">
        <div className="max-w-lg py-16">
          <TextLogo />
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Music That Connects
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Build your perfect playlist, invite your friends, and vibe together
            no matter where you are. Your music library becomes a shared
            experience.
          </p>
          <ul className="flex flex-col gap-4">
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span className="text-sm text-muted-foreground">
                Curate playlists that tell your story
              </span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span className="text-sm text-muted-foreground">
                Sync up and listen with friends in real-time
              </span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span className="text-sm text-muted-foreground">
                Upload and access your tracks anywhere
              </span>
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Where music meets friendship.
          </p>
        </div>
      </div>

      {/* Right side - Auth */}
      <div className="flex flex-1 items-center justify-center bg-background text-foreground px-6 py-16">
        <Card className="w-full max-w-md border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">
              Sign in to GrooveStream
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              variant="outline"
              size="lg"
              className="w-full flex items-center justify-center gap-2 hover:bg-secondary/30"
              onClick={() => {
                // Hook up with NextAuth's signIn("google") here
                signInGoogle();
              }}
            >
              <FcGoogle className="w-5 h-5" />
              <span>Continue with Google</span>
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                By signing in, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
