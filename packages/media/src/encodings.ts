import { listAudiofileEncodings } from "@groovestream/api/sdk";
import type { Audiofile, Encoding } from "@groovestream/api/models";

export type MediaDelivery = "dash" | "hls";

/** Values are ordered from highest to lowest priority. */
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

/** Maps preference values to their rank, where a lower rank is preferred. */
function getPreferenceRanks<T>(values: readonly T[]) {
  return new Map(values.map((value, rank) => [value, rank]));
}

/** Returns every supported playback candidate, ordered best first. */
export function getPlaybackItems(
  encodings: readonly Encoding[],
  preferences: MediaPreferences,
): PlaybackItem[] {
  const codecRanks = getPreferenceRanks(preferences.codecs);
  const deliveryRanks = getPreferenceRanks(preferences.deliveries);
  const items = encodings
    .filter((encoding) => codecRanks.has(encoding.codec))
    .flatMap((encoding) =>
      getEncodingDeliveries(encoding).map(({ delivery, objectId }) => ({
        encoding,
        objectId,
        delivery,
      })),
    )
    .filter((item) => deliveryRanks.has(item.delivery));

  // Codec is the primary preference and delivery is the secondary preference.
  // Equal candidates retain their input order because Array.sort is stable.
  items.sort((left, right) => {
    const codecRank =
      // we coallesce with MAX_SAFE_INTEGER since Map.get() can return undefined.
      // In practice, the result should always be defined
      (codecRanks.get(left.encoding.codec) ?? Number.MAX_SAFE_INTEGER) -
      (codecRanks.get(right.encoding.codec) ?? Number.MAX_SAFE_INTEGER);
    if (codecRank !== 0) return codecRank;

    return (
      (deliveryRanks.get(left.delivery) ?? Number.MAX_SAFE_INTEGER) -
      (deliveryRanks.get(right.delivery) ?? Number.MAX_SAFE_INTEGER)
    );
  });

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
