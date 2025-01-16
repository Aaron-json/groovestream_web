import { createFileRoute, redirect } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import AppSidebar from "../components/custom/appsidebar";
import { SidebarProvider } from "../components/ui/sidebar";
import MediaBar from "@/components/custom/mediabar";
import { QueryClientProvider } from "@tanstack/react-query";
import TopBar from "@/components/custom/topbar";
import { QueryClient } from "@tanstack/react-query";
import { MediaContextProvider } from "@/contexts/media";
import { ToastProvider } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
      });
    }
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

function AuthenticatedLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <MediaContextProvider>
        <ToastProvider>
          <SidebarProvider>
            <AppSidebar />
            <div className="relative flex flex-col gap-3 w-full px-2">
              <TopBar />
              <div className="w-full px-2">
                <Outlet />
              </div>
              <MediaBar />
            </div>
            <Toaster />
          </SidebarProvider>
        </ToastProvider>
      </MediaContextProvider>
    </QueryClientProvider>
  );
}
