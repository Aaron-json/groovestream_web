import { listAudiofileEncodings } from "@groovestream/api/sdk";
import type { Audiofile, Encoding } from "@groovestream/api/models";

export type MediaDelivery = "dash" | "hls";

/** Values are ordered from lowest to highest priority. */
export type MediaPreferences = Readonly<{
  codecs: readonly string[];
  deliveries: readonly MediaDelivery[];
}>;

export type PlaybackItem = Readonly<{
  encoding: Readonly<Encoding>;
  objectId: string;
  delivery: MediaDelivery;
}>;

type EncodingDelivery = Readonly<{
  delivery: MediaDelivery;
  objectId: string;
}>;

function getEncodingDeliveries(encoding: Encoding): EncodingDelivery[] {
  const deliveries: EncodingDelivery[] = [];
  if (encoding.dash_manifest_id) {
    deliveries.push({ delivery: "dash", objectId: encoding.dash_manifest_id });
  }
  if (encoding.hls_manifest_id) {
    deliveries.push({ delivery: "hls", objectId: encoding.hls_manifest_id });
  }
  return deliveries;
}

/** Maps preference values from lowest to highest priority. */
function getPriorities<T>(values: readonly T[]) {
  return new Map(values.map((value, priority) => [value, priority]));
}

/** Returns every supported playback candidate, ordered best first. */
export function getPlaybackItems(
  encodings: readonly Encoding[],
  preferences: MediaPreferences,
): PlaybackItem[] {
  const codecPriorities = getPriorities(preferences.codecs);
  const deliveryPriorities = getPriorities(preferences.deliveries);
  const items = encodings
    .filter((encoding) => codecPriorities.has(encoding.codec))
    .flatMap((encoding) =>
      getEncodingDeliveries(encoding).map(({ delivery, objectId }) => ({
        encoding,
        objectId,
        delivery,
      })),
    )
    .filter((item) => deliveryPriorities.has(item.delivery));

  // Sort the least important metric first. Array.sort is stable, so the codec
  // pass remains dominant and API order remains the final tie-breaker.
  items.sort(
    (left, right) =>
      (deliveryPriorities.get(right.delivery) ?? -1) -
      (deliveryPriorities.get(left.delivery) ?? -1),
  );
  items.sort(
    (left, right) =>
      (codecPriorities.get(right.encoding.codec) ?? -1) -
      (codecPriorities.get(left.encoding.codec) ?? -1),
  );

  return items;
}

/** Resolves a track's supported playback candidates when a player loads it. */
export async function resolvePlaybackItems(
  audiofile: Audiofile,
  preferences: MediaPreferences,
  signal?: AbortSignal,
): Promise<PlaybackItem[]> {
  const encodings =
    (await listAudiofileEncodings({
      path: { audiofile_id: audiofile.id },
      signal,
    })) ?? [];
  signal?.throwIfAborted();
  return getPlaybackItems(encodings, preferences);
}
