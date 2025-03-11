import SidebarToggle from "./sidebar-toggle";
import Avatar from "./avatar";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-50 w-full h-12 flex items-center justify-between px-2 bg-background/60 backdrop-blur-sm border-b">
      <div className="h-full flex items-center">
        <SidebarToggle />
      </div>
      <div className="h-full flex items-center">
        <Avatar />
      </div>
    </header>
  );
}
