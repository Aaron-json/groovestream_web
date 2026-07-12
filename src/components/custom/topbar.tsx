import SidebarToggle from "./sidebar-toggle";
import TasksDropdown from "./tasks-dropdown";
import { signOut, useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { CustomAvatar, CustomAvatarSkeleton } from "./avatar";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/user";
import { Link, useMatches, useRouter } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";
import { Crumb } from "@/types/router";

const AvatarDropdown = () => {
  const { data: userData, isLoading: userDataLoading } = useUser();
  const { sessionRef } = useAuth();

  const url =
    sessionRef.current?.user.user_metadata?.avatar_url ||
    sessionRef.current?.user.user_metadata?.picture;
  const email = sessionRef.current?.user?.email;

  if (userDataLoading) {
    return <CustomAvatarSkeleton />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded-full">
            <CustomAvatar username={userData?.username} picture_url={url} />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {!email && !userData ? (
              <p className="text-sm text-muted-foreground">
                Failed to load user data
              </p>
            ) : (
              <div className="flex flex-col leading-tight">
                <p>{userData?.username}</p>
                {email && <p className="text-muted-foreground">{email}</p>}
              </div>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Collects the breadcrumb entries declared by every matched route
// through the "crumbs" static data option. See src/types/router.ts.
function useCrumbs(): Crumb[] {
  const matches = useMatches();
  return matches.flatMap(
    (match) =>
      match.staticData.crumbs?.(match.params as Record<string, string>) ?? [],
  );
}

export default function TopBar() {
  const crumbs = useCrumbs();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 grid h-12 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2 bg-background/60 backdrop-blur-sm border-b">
      <div className="flex items-center gap-1">
        <SidebarToggle />
        {router.history.canGoBack() && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.history.back()}
            aria-label="Go back"
          >
            <ArrowLeft />
          </Button>
        )}
      </div>
      <Breadcrumbs crumbs={crumbs} />
      <div className="flex items-center gap-2">
        <TasksDropdown />
        <AvatarDropdown />
      </div>
    </header>
  );
}

function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap justify-center">
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <Fragment key={crumb.to}>
              {idx > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem className="min-w-0">
                {isLast ? (
                  <BreadcrumbPage className="truncate font-medium">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    className="truncate"
                    render={<Link to={crumb.to} params={crumb.params} />}
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
