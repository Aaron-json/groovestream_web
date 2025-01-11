import { MenuIcon } from "lucide-react";
import { useSidebar } from "../ui/sidebar";
import { Button } from "@/components/ui/button";

export default function SidebarToggle() {
  function handleClick() {
    const { toggleSidebar, setOpenMobile, isMobile } = useSidebar();
    if (isMobile) {
      setOpenMobile(true);
    } else {
      toggleSidebar();
    }
  }
  return (
    <Button
      onClick={handleClick}
      variant="ghost"
      size="icon"
      className="h-10 w-auto aspect-square"
    >
      <MenuIcon
        strokeWidth={2.1}
        size={24}
        className="h-full w-auto aspect-square"
      />
    </Button>
  );
}
