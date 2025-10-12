import { createFileRoute, redirect } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import AppSidebar from "../components/custom/appsidebar";
import { SidebarProvider } from "../components/ui/sidebar";
import MediaBar from "@/components/custom/mediabar";
import TopBar from "@/components/custom/topbar";
import { Toaster } from "@/components/ui/sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initPlayer, isBrowserSupported } from "@/lib/media";
import TextLogo from "@/components/custom/textlogo";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/auth",
      });
    }
    if (context.user === null) {
      throw redirect({
        to: "/complete-profile",
      });
    }
  },
});

function AuthenticatedLayout() {
  const isSupported = isBrowserSupported();
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    initPlayer(null).then(() => {
      setIsPlayerReady(true);
    });
  }, []);

  if (!isSupported) {
    return (
      <section className="h-full flex flex-col items-center p-4 gap-8">
        <div className="flex flex-none items-center justify-center h-28">
          <TextLogo />
        </div>
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Browser not supported</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Your browser does not support the required features for this
              application. Please use a different browser or update your browser
              to a newer version.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!isPlayerReady) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col w-full px-2 overflow-hidden">
        <TopBar />
        <div className="flex-1 py-2 px-8 mb-2 overflow-hidden">
          <Outlet />
        </div>
        <div className="sticky bottom-2 left-2 right-2">
          <MediaBar />
        </div>
      </div>
      <Toaster position="bottom-left" />
    </SidebarProvider>
  );
}
