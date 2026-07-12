import type { ReactNode } from "react";
import type { FileRouteTypes } from "@/routeTree.gen";

// A single entry in the top bar's breadcrumb trail.
// "to" is constrained to routes that actually exist so crumb
// links break at compile time when routes are renamed.
export type Crumb = {
  label: ReactNode;
  to: FileRouteTypes["to"];
  params?: Record<string, string>;
};

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    // Breadcrumb entries this route contributes to the trail,
    // built from its resolved path params. A route may contribute
    // more than one entry (ex. a flat route adding its logical parent).
    crumbs?: (params: Record<string, string>) => Crumb[];
  }
}
