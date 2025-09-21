import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { User } from "@/api/types/user";

type RouterContext = {
  auth: ReturnType<typeof useAuth>;
  user: User | null;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});
