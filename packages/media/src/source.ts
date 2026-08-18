import type { Audiofile } from "@groovestream/api/models";

export interface AudioSourcePagination {
  hasMore(): boolean;
  isLoading(): boolean;
  loadMore(): Promise<void>;
}

/** A live ordered queue whose contents are read from its owning cache. */
export interface AudioSource {
  getAudiofiles(): readonly Audiofile[];
  subscribe(listener: () => void): () => void;
  pagination?: AudioSourcePagination;
}

export function getNextAudioIndex(
  audiofiles: readonly Audiofile[],
  currentId: Audiofile["id"],
  action: "next" | "prev",
  currentIndex?: number,
  wrap = true,
): number | undefined {
  const position = audiofiles.findIndex(({ id }) => id === currentId);

  if (position === -1) {
    if (action === "next") {
      const index = currentIndex ?? 0;
      if (audiofiles[index]) return index;
      return wrap && audiofiles.length > 0 ? 0 : undefined;
    } else {
      const index = (currentIndex ?? audiofiles.length) - 1;
      if (audiofiles[index]) return index;
      return wrap && audiofiles.length > 0 ? audiofiles.length - 1 : undefined;
    }
  }

  const nextIndex = action === "next" ? position + 1 : position - 1;
  if (audiofiles[nextIndex]) return nextIndex;
  if (!wrap || audiofiles.length === 0) return undefined;
  return action === "next" ? 0 : audiofiles.length - 1;
}
