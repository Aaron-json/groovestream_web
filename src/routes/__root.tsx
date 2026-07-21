import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import type { User } from "@/api/types";

type RouterContext = {
  auth: ReturnType<typeof useAuth>;
  user: User | null;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});
