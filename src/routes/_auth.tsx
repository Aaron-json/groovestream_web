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
      <div className="p-2 border-b-2 h-12 flex align-center text-center">
        <TextLogo />
      </div>
      <Outlet />
    </div>
  );
}
