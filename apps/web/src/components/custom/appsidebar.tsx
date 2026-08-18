import { HomeIcon, LibraryIcon } from "lucide-react";
import {
  Sidebar,
  SidebarMenu,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuItem,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { TextLogo } from "./textlogo";
import { Link } from "@tanstack/react-router";
import SidebarUserCard from "./sidebar-user-card";
import { SidebarPlaylists } from "./sidebar-playlists";

const navItems = [
  {
    title: "Home",
    url: "/home",
    icon: HomeIcon,
  },
  {
    title: "Library",
    url: "/library",
    icon: LibraryIcon,
  },
];

export default function AppSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();

  function onMobileClick() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }
  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <TextLogo className="justify-center" />
      </SidebarHeader>
      <SidebarContent className="flex flex-col min-h-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link
                    to={item.url}
                    onClick={onMobileClick}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
                    activeProps={{
                      className:
                        "bg-muted text-foreground font-medium shadow-sm",
                    }}
                  >
                    <item.icon className="size-5 shrink-0 opacity-70" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarPlaylists />
      </SidebarContent>
      <SidebarFooter className="flex justify-center w-full">
        <SidebarUserCard />
      </SidebarFooter>
    </Sidebar>
  );
}
