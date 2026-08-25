import type { Audiofile } from "@groovestream/api/models";
import { shallow } from "zustand/shallow";

export interface AudioSourcePagination {
  loadMore(): Promise<void>;
}

/** Immutable observable state for a live audio source. */
export type AudioSourceSnapshot = Readonly<{
  audiofiles: readonly Audiofile[];
  pagination:
    | Readonly<{
        hasMore: boolean;
        isLoading: boolean;
      }>
    | undefined;
}>;

/**
 * A live ordered playback queue. Implementations own their storage and
 * snapshot stability; consumers observe them through this interface.
 * Audiofile IDs must be unique within a source so a moved position can be
 * recovered unambiguously after the source changes.
 */
export interface AudioSource {
  /** Returns the same object until the source's observable state changes. */
  getSnapshot(): AudioSourceSnapshot;
  /** Notifies that `getSnapshot()` may return a different object. */
  subscribe(listener: () => void): () => void;
  /** Present when the source can extend its current snapshot. */
  pagination?: AudioSourcePagination;
}

/**
 * A cursor into a live source. The index is the fast path and the audiofile ID
 * prevents a stale cursor from silently selecting another track.
 *
 * Positions can become stale whenever their source emits. The component that
 * owns a retained position must reconcile it before using the index again.
 */
export type AudioSourcePosition = Readonly<{
  source: AudioSource;
  index: number;
  audiofile: Audiofile;
}>;

export function getAudioSourcePosition(
  source: AudioSource,
  index: number,
): AudioSourcePosition | undefined {
  const audiofile = source.getSnapshot().audiofiles[index];
  return audiofile ? { source, index, audiofile } : undefined;
}

/**
 * Reconciles a position against the current source snapshot. This function is
 * deliberately policy-free: the position owner decides what removal means.
 * Most calls take the O(1) index path; an ID scan is reserved for actual moves.
 */
export function reconcileAudioSourcePosition(
  position: AudioSourcePosition,
): AudioSourcePosition | undefined {
  const audiofiles = position.source.getSnapshot().audiofiles;
  const audiofileAtIndex = audiofiles[position.index];

  if (audiofileAtIndex?.id === position.audiofile.id) {
    if (shallow(audiofileAtIndex, position.audiofile)) return position;
    return { ...position, audiofile: audiofileAtIndex };
  }

  const index = audiofiles.findIndex(({ id }) => id === position.audiofile.id);
  if (index === -1) return undefined;
  return { source: position.source, index, audiofile: audiofiles[index] };
}

/** Returns a neighbor of an already reconciled position without an ID scan. */
export function getAdjacentAudioSourcePosition(
  position: AudioSourcePosition,
  direction: "next" | "previous",
  wrap = true,
): AudioSourcePosition | undefined {
  const audiofiles = position.source.getSnapshot().audiofiles;
  const adjacentIndex =
    direction === "next" ? position.index + 1 : position.index - 1;
  const audiofile = audiofiles[adjacentIndex];
  if (audiofile) {
    return { source: position.source, index: adjacentIndex, audiofile };
  }
  if (!wrap || audiofiles.length === 0) return undefined;

  const wrappedIndex = direction === "next" ? 0 : audiofiles.length - 1;
  return {
    source: position.source,
    index: wrappedIndex,
    audiofile: audiofiles[wrappedIndex],
  };
}
