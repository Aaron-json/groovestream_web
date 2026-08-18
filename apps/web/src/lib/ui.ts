import { create } from "zustand";

// Cross-cutting UI state shared between layout components
// (ex. the media bar toggles the now playing panel).
type UIState = {
  nowPlayingOpen: boolean;
  setNowPlayingOpen: (open: boolean) => void;
  toggleNowPlaying: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  nowPlayingOpen: false,
  setNowPlayingOpen: (open) => set({ nowPlayingOpen: open }),
  toggleNowPlaying: () =>
    set((state) => ({ nowPlayingOpen: !state.nowPlayingOpen })),
}));
