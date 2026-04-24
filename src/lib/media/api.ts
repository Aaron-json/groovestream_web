import { AudioDeliverable, Audiofile } from "@/api/types/media";
import {
  getDeliverables,
  getDeliverableToken,
  addListeningHistory,
} from "@/api/requests/media";

export interface ResolvedDeliverable {
  deliverable: AudioDeliverable;
  manifestUrl: string;
  token: string;
}

export async function resolveDeliverable(
  audiofileId: Audiofile["id"],
): Promise<ResolvedDeliverable> {
  const deliverables = await getDeliverables(audiofileId);

  if (!deliverables) {
    throw new Error(`No deliverables found for audiofile_id: ${audiofileId}`);
  }

  // get manifest url. prefer dash over hls
  let idx = deliverables.findIndex((d) => d.dash_manifest_id);
  let url = deliverables[idx]?.dash_manifest_id;

  if (idx === -1) {
    idx = deliverables.findIndex((d) => d.hls_manifest_id);
    url = deliverables[idx]?.hls_manifest_id;
  }

  if (!url || idx === undefined) {
    throw new Error(
      `No DASH or HLS manifest found for audiofile_id: ${audiofileId}`,
    );
  }

  const tokenData = await getDeliverableToken(deliverables[idx].id);

  return {
    deliverable: deliverables[idx],
    manifestUrl: url,
    token: tokenData.token,
  };
}

export function trackHistory(audiofileId: Audiofile["id"]) {
  // fire and forget
  addListeningHistory(audiofileId).catch(() => {});
}
