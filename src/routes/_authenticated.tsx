import { createFileRoute, redirect } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import AppSidebar from "../components/custom/appsidebar";
import { SidebarProvider } from "../components/ui/sidebar";
import MediaBar from "@/components/custom/mediabar";
import TopBar from "@/components/custom/topbar";
import { Toaster } from "@/components/ui/sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TextLogo from "@/components/custom/textlogo";
import { useEffect, useState } from "react";
import { useMediaStateStore } from "@/lib/media/stores/state";
import WebAudioPlayer from "@/lib/media/player/web";
import { RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/auth" });
    }
    if (context.user === null) {
      throw redirect({ to: "/complete-profile" });
    }
  },
});

function AuthenticatedLayout() {
  const init = useMediaStateStore((state) => state.init);
  const player = useMediaStateStore((state) => state.player);
  const [initError, setInitError] = useState(false);

  useEffect(() => {
    // if player is already initialized (e.g. hot reload), skip
    if (player) return;

    let mounted = true;

    const initializer = async () => {
      try {
        await init(() => new WebAudioPlayer());
      } catch (e) {
        console.error("Audio Init Error:", e);
        if (mounted) setInitError(true);
      }
    };

    initializer();

    return () => {
      mounted = false;
    };
  }, [init, player]);

  if (initError) {
    return (
      <section className="h-full flex flex-col items-center justify-center p-4 gap-8">
        <div className="flex flex-none items-center justify-center">
          <TextLogo />
        </div>
        <Card className="w-full max-w-xl border-destructive/50">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Audio Engine Failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground text-md">
              We encountered a critical error while initializing the audio
              player. This usually happens if the browser blocked audio access
              or if system resources are unavailable.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </Button>
          </CardFooter>
        </Card>
      </section>
    );
  }

  if (!player) {
    return null;
  }

  const isSupported = player.isSupported();

  if (!isSupported) {
    return (
      <section className="h-full flex flex-col items-center justify-center p-4 gap-8">
        <div className="flex flex-none items-center justify-center">
          <TextLogo />
        </div>
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Browser Not Supported</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Your browser does not support the required media features
              (MSE/EME) for this application. Please use a recent version of
              Chrome, Firefox, Safari, or Edge.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col w-full h-dvh overflow-hidden px-2">
        <TopBar />
        <div className="flex-1 py-2 px-2 md:px-8 overflow-y-auto">
          <Outlet />
        </div>
        <div className="flex-none pb-2">
          <MediaBar />
        </div>
      </div>
      <Toaster position="bottom-left" />
    </SidebarProvider>
  );
}
