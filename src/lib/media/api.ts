import {
  addListeningHistory,
  createEncodingToken,
  listAudiofileEncodings,
} from "@/api/generated/sdk.gen";
import type { Audiofile } from "@/api/types";
import type { Encoding } from "@/api/generated/types.gen";
import {
  addListeningHistoryToCache,
  invalidateMostPlayed,
} from "@/query/media";

export interface ResolvedEncoding {
  encoding: Encoding;
  manifestUrl: string;
  token: string;
}

export async function resolveEncoding(
  audiofileId: Audiofile["id"],
): Promise<ResolvedEncoding> {
  const encodings =
    (await listAudiofileEncodings({
      path: { audiofile_id: audiofileId },
    })) ?? [];

  // get manifest url. prefer dash over hls
  let idx = encodings.findIndex((d) => d.dash_manifest_id);
  let url = encodings[idx]?.dash_manifest_id;

  if (idx === -1) {
    idx = encodings.findIndex((d) => d.hls_manifest_id);
    url = encodings[idx]?.hls_manifest_id;
  }

  if (!url || idx === undefined || idx === -1) {
    throw new Error(
      `No DASH or HLS manifest found for audiofile_id: ${audiofileId}`,
    );
  }

  const tokenData = await createEncodingToken({
    path: { encoding_id: encodings[idx].id },
  });

  return {
    encoding: encodings[idx],
    manifestUrl: url,
    token: tokenData.token,
  };
}

export function trackHistory(audiofileId: Audiofile["id"]) {
  void addListeningHistory({ path: { audiofile_id: audiofileId } })
    .then((historyItem) => {
      addListeningHistoryToCache(historyItem);
      void invalidateMostPlayed();
    })
    .catch(() => {
      // Listening history is supplemental and must not interrupt playback.
    });
}
