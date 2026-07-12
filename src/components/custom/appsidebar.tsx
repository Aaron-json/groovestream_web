import { HomeIcon, LibraryIcon, ListMusic, Volume2 } from "lucide-react";
import {
  Sidebar,
  SidebarMenu,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuItem,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { playlistsListOptions } from "@/hooks/media";
import { useMediaStateStore } from "@/lib/media/stores/state";
import { useShallow } from "zustand/react/shallow";
import { TextLogo } from "./textlogo";
import { Link } from "@tanstack/react-router";
import SidebarUserCard from "./sidebar-user-card";
import { useQuery } from "@tanstack/react-query";
import { Playlist } from "@/api/requests/media";

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
  const { data: playlists } = useQuery(playlistsListOptions());
  const currentlyPlayingPlaylistId = useMediaStateStore(
    useShallow((state) => state.media?.audiofile.playlist_id),
  );

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

        {playlists && playlists.length > 0 && (
          <SidebarGroup className="flex-1 min-h-0 overflow-hidden pt-4 pb-0">
            <SidebarGroupLabel className="text-xs uppercase font-semibold tracking-wider text-muted-foreground mb-1 px-4">
              Your Playlists
            </SidebarGroupLabel>
            <SidebarGroupContent className="h-full flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                <SidebarMenu>
                  {playlists.map((playlist: Playlist) => {
                    const isPlaying =
                      playlist.id === currentlyPlayingPlaylistId;
                    return (
                      <SidebarMenuItem key={playlist.id}>
                        <Link
                          to="/library/playlists/$playlistId"
                          params={{ playlistId: playlist.id }}
                          onClick={onMobileClick}
                          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
                          activeProps={{
                            className:
                              "bg-muted text-foreground font-medium shadow-sm",
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <ListMusic className="size-4 shrink-0 opacity-70" />
                            <span className="truncate text-sm">
                              {playlist.name}
                            </span>
                          </div>
                          {isPlaying && (
                            <Volume2 className="size-4 shrink-0 text-primary opacity-80" />
                          )}
                        </Link>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="flex justify-center w-full">
        <SidebarUserCard />
      </SidebarFooter>
    </Sidebar>
  );
}
