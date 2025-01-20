import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import TextLogo from "@/components/custom/textlogo";

export const Route = createFileRoute("/_auth")({
  component: RouteLayout,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: "/",
      });
    }
  },
});

function RouteLayout() {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="border-b-2 shrink-0 h-12 flex items-end">
        <TextLogo />
      </div>
      <Outlet />
    </div>
  );
}
