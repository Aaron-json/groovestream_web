import type { Audiofile } from "@/api/types";

export function formatDuration(duration?: number | null): string {
  if (duration === null || duration === undefined) return "--:--";
  duration = Math.floor(duration);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getNextAudioIndex(
  medialist: Audiofile[],
  currentId: string,
  action: "next" | "prev",
  currentIndex?: number,
): number {
  const pos = medialist.findIndex((val) => val.id === currentId);
  let index: number;

  if (pos === -1) {
    // song removed from list, use fallback index
    if (currentIndex === undefined) return 0;
    index = currentIndex;
  } else {
    index = pos;
  }

  if (action === "next") {
    return (index + 1) % medialist.length;
  } else {
    // handles negative modulo
    return (index - 1 + medialist.length) % medialist.length;
  }
}
