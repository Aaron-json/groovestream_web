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
  const { isMobile, setOpenMobile } = useSidebar();

  function onMobileClick() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }
  return (
    <Sidebar>
      <SidebarHeader>
        <TextLogo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link
                    className="flex items-center gap-2 px-4 py-2 hover:bg-muted transition-colors duration-100 rounded-md"
                    to={item.url}
                    onClick={onMobileClick}
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
