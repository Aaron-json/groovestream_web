import { createFileRoute, redirect } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import AppSidebar from "../components/custom/appsidebar";
import { SidebarProvider } from "../components/ui/sidebar";
import MediaBar from "@/components/custom/mediabar";
import { QueryClientProvider } from "@tanstack/react-query";
import TopBar from "@/components/custom/topbar";
import { QueryClient } from "@tanstack/react-query";
import { MediaContextProvider } from "@/contexts/media";
import { Toaster } from "@/components/ui/sonner";

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

export const queryClient = new QueryClient({
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
        <SidebarProvider>
          <AppSidebar />
          <div className="flex flex-col w-full px-2">
            <TopBar />
            <div className="flex-1 p-2 mb-2">
              <Outlet />
            </div>
            <div className={`sticky bottom-2 left-2 right-2`}>
              <MediaBar />
            </div>
          </div>
          <Toaster position="bottom-left" />
        </SidebarProvider>
      </MediaContextProvider>
    </QueryClientProvider>
  );
}
