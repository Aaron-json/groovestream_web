import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import type { Encoding } from "@groovestream/api/models";
import {
  getPlaybackItems,
  type MediaPreferences,
} from "./encodings.ts";

function createEncoding(
  id: string,
  overrides: Partial<Encoding> = {},
): Encoding {
  return {
    audiofile_id: "audiofile-id",
    base_file_id: `${id}.file`,
    base_file_size: 1_000,
    bitrate: 256_000,
    channels: 2,
    codec: "aac",
    container: "mp4",
    created_at: "2026-01-01T00:00:00Z",
    dash_manifest_id: null,
    fragment_duration: null,
    hls_manifest_id: null,
    id,
    objects_prefix: id,
    sample_rate: 48_000,
    ...overrides,
  };
}

const preferences: MediaPreferences = {
  codecs: ["opus", "aac"],
  deliveries: ["dash", "hls"],
};

test("filters unsupported codecs and unavailable deliveries", () => {
  const supported = createEncoding("supported", {
    dash_manifest_id: "supported.dash",
  });
  const unsupportedCodec = createEncoding("unsupported-codec", {
    codec: "flac",
    dash_manifest_id: "unsupported-codec.dash",
  });
  const unsupportedDelivery = createEncoding("unsupported-delivery", {
    hls_manifest_id: "unsupported-delivery.hls",
  });
  const unavailableDelivery = createEncoding("unavailable-delivery");

  const items = getPlaybackItems(
    [
      supported,
      unsupportedCodec,
      unsupportedDelivery,
      unavailableDelivery,
    ],
    { ...preferences, deliveries: ["dash"] },
  );

  deepStrictEqual(
    items.map(({ encoding, objectId, delivery }) => ({
      encodingId: encoding.id,
      objectId,
      delivery,
    })),
    [
      {
        encodingId: "supported",
        objectId: "supported.dash",
        delivery: "dash",
      },
    ],
  );
});

test("sorts delivery first and codec last so codec remains dominant", () => {
  const aac = createEncoding("aac", {
    dash_manifest_id: "aac.dash",
  });
  const opus = createEncoding("opus", {
    codec: "opus",
    dash_manifest_id: "opus.dash",
    hls_manifest_id: "opus.hls",
  });

  const items = getPlaybackItems([aac, opus], preferences);

  deepStrictEqual(
    items.map(({ encoding, delivery }) => `${encoding.id}:${delivery}`),
    ["aac:dash", "opus:hls", "opus:dash"],
  );
});

test("preserves API order as the final tie-breaker", () => {
  const first = createEncoding("first", {
    codec: "opus",
    dash_manifest_id: "first.dash",
  });
  const second = createEncoding("second", {
    codec: "opus",
    dash_manifest_id: "second.dash",
  });

  const items = getPlaybackItems([first, second], preferences);

  deepStrictEqual(
    items.map(({ encoding }) => encoding.id),
    ["first", "second"],
  );
});

test("retains the complete encoding on every playback candidate", () => {
  const encoding = createEncoding("full-encoding", {
    bitrate: 320_000,
    dash_manifest_id: "full-encoding.dash",
    hls_manifest_id: "full-encoding.hls",
  });

  const items = getPlaybackItems([encoding], preferences);

  strictEqual(items.length, 2);
  strictEqual(items[0]?.encoding, encoding);
  strictEqual(items[1]?.encoding, encoding);
  strictEqual(items[0]?.encoding.bitrate, 320_000);
});

test("returns an empty list when the client supports no encoding", () => {
  const encoding = createEncoding("unsupported", {
    dash_manifest_id: "unsupported.dash",
  });

  deepStrictEqual(
    getPlaybackItems([encoding], { codecs: [], deliveries: ["dash"] }),
    [],
  );
});
