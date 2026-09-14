import type { Audiofile } from "@groovestream/api/models";
import { shallow } from "zustand/shallow";

export interface AudioSourcePagination {
  loadMore(): Promise<void>;
}

/** One occurrence of an audiofile in an ordered playback source. */
export type AudioSourceItem = Readonly<{
  /** Stable within the source, including when the same audiofile occurs twice. */
  id: string;
  audiofile: Audiofile;
}>;

/** Immutable observable state for a live audio source. */
export type AudioSourceSnapshot = Readonly<{
  items: readonly AudioSourceItem[];
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
 * Source item IDs must be unique so positions can be recovered unambiguously
 * after the source changes. The same audiofile may occur more than once.
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
 * A cursor into a live source. The index is the fast path and the source item
 * ID prevents a stale cursor from silently selecting another occurrence.
 *
 * Positions can become stale whenever their source emits. The component that
 * owns a retained position must reconcile it before using the index again.
 */
export type AudioSourcePosition = Readonly<{
  source: AudioSource;
  index: number;
  item: AudioSourceItem;
}>;

function createPosition(
  source: AudioSource,
  index: number,
  item: AudioSourceItem,
): AudioSourcePosition {
  return { source, index, item };
}

export function getAudioSourcePosition(
  source: AudioSource,
  index: number,
): AudioSourcePosition | undefined {
  const item = source.getSnapshot().items[index];
  return item ? createPosition(source, index, item) : undefined;
}

/**
 * Reconciles a position against the current source snapshot. This function is
 * deliberately policy-free: the position owner decides what removal means.
 * Most calls take the O(1) index path; an ID scan is reserved for actual moves.
 */
export function reconcileAudioSourcePosition(
  position: AudioSourcePosition,
): AudioSourcePosition | undefined {
  const items = position.source.getSnapshot().items;
  const itemAtIndex = items[position.index];

  if (itemAtIndex?.id === position.item.id) {
    if (shallow(itemAtIndex.audiofile, position.item.audiofile)) return position;
    return { ...position, item: itemAtIndex };
  }

  const index = items.findIndex(({ id }) => id === position.item.id);
  if (index === -1) return undefined;
  return createPosition(position.source, index, items[index]);
}

/** Returns a neighbor of an already reconciled position without an ID scan. */
export function getAdjacentAudioSourcePosition(
  position: AudioSourcePosition,
  direction: "next" | "previous",
  wrap = true,
): AudioSourcePosition | undefined {
  const items = position.source.getSnapshot().items;
  const adjacentIndex =
    direction === "next" ? position.index + 1 : position.index - 1;
  const item = items[adjacentIndex];
  if (item) {
    return createPosition(position.source, adjacentIndex, item);
  }
  if (!wrap || items.length === 0) return undefined;

  const wrappedIndex = direction === "next" ? 0 : items.length - 1;
  return createPosition(position.source, wrappedIndex, items[wrappedIndex]);
}
