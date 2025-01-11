import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/auth/state";

type RouterContext = {
  auth: ReturnType<typeof useAuth>;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});
