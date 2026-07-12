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
import { createLink, Link } from "@tanstack/react-router";
import SidebarUserCard from "./sidebar-user-card";
import { Button } from "@/components/ui/button";

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

type CustomLinkProps = React.ComponentProps<typeof Link>;

const CustomLink = (props: CustomLinkProps) => {
  return (
    <Button
      variant="ghost"
      size="lg"
      className="w-full flex justify-start"
      nativeButton={false}
      render={<Link {...props} />}
    />
  );
};

const CreatedCustomLink = createLink(CustomLink);

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
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <CreatedCustomLink
                    className="flex items-center rounded gap-2 px-4 py-2 hover:bg-muted transition-colors duration-100"
                    to={item.url}
                    onClick={onMobileClick}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </CreatedCustomLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex justify-center w-full">
        <SidebarUserCard />
      </SidebarFooter>
    </Sidebar>
  );
}
