import { HomeIcon, LibraryIcon } from "lucide-react";
import {
  Sidebar,
  SidebarMenu,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import TextLogo from "./textlogo";
import { Link } from "@tanstack/react-router";

const navItems = [
  {
    title: "Home",
    url: "/",
    icon: HomeIcon,
  },
  {
    title: "Library",
    url: "/library",
    icon: LibraryIcon,
  },
  // {
  //   title: "Social",
  //   url: "/social",
  //   icon: MessageCircle,
  // },
];

export default function AppSidebar() {
  return (
    <Sidebar>
      <SidebarFooter>
        <TextLogo />
      </SidebarFooter>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link
                    className="flex items-center gap-2 px-4 py-2 hover:bg-muted transition-colors duration-100 rounded-md"
                    to={item.url}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
