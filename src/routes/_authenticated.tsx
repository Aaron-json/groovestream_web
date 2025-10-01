import { createFileRoute, redirect } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import AppSidebar from "../components/custom/appsidebar";
import { SidebarProvider } from "../components/ui/sidebar";
import MediaBar from "@/components/custom/mediabar";
import TopBar from "@/components/custom/topbar";
import { Toaster } from "@/components/ui/sonner";

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
