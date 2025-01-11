import { HomeIcon, LibraryIcon } from "lucide-react";
import {
  Sidebar,
  SidebarMenu,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import TextLogo from "./textlogo";

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
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
