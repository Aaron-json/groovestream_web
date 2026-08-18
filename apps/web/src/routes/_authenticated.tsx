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
import { TextLogo } from "@/components/custom/textlogo";
import { useEffect, useState } from "react";
import { usePlaybackStore } from "@groovestream/media/playback-store";
import WebAudioPlayer from "@/lib/media/player";
import { recordListeningHistory } from "@groovestream/query/media";
import { queryClient } from "@/lib/query";
import { RefreshCw } from "lucide-react";
import { NowPlayingPanel } from "@/components/custom/now-playing-panel";

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
  const init = usePlaybackStore((state) => state.init);
  const destroy = usePlaybackStore((state) => state.destroy);
  const player = usePlaybackStore((state) => state.player);
  const [initError, setInitError] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initializer = async () => {
      try {
        const webPlayer = new WebAudioPlayer();
        if (!webPlayer.isSupported()) {
          if (!cancelled) setUnsupported(true);
          return;
        }

        await init(webPlayer, {
          onMediaChange: (media) => {
            void recordListeningHistory(queryClient, media.audiofile.id).catch(
              () => {},
            );
          },
        });
      } catch (e) {
        console.error("Audio Init Error:", e);
        if (!cancelled) setInitError(true);
      }
    };

    void initializer();

    return () => {
      cancelled = true;
      void destroy().catch(() => {});
    };
  }, [destroy, init]);

  if (unsupported) {
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
              Your browser does not support the media features required for
              playback. Please use a recent version of Chrome, Firefox, Safari,
              or Edge.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

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

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden px-2">
        <div className="grid flex-1 min-h-0 grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex min-w-0 flex-col">
            <TopBar />
            <div className="flex-1 overflow-y-auto py-2 px-2 md:px-8">
              <Outlet />
            </div>
          </div>
          <NowPlayingPanel />
        </div>
        <div className="flex-none pb-2">
          <MediaBar />
        </div>
      </main>
      <Toaster position="bottom-left" />
    </SidebarProvider>
  );
}
