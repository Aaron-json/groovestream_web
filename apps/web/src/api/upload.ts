import { confirmUpload, createUpload } from "@groovestream/api/sdk";
import type { Playlist } from "@groovestream/api/models";

type UploadAudiofileOptions = {
  onProgress?: (current: number, total: number) => void;
};

const browserManagedHeaders = new Set(["content-length", "host"]);

function uploadToSignedUrl(
  file: File,
  request: { headers: Record<string, string>; method: string; url: string },
  onProgress?: UploadAudiofileOptions["onProgress"],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(request.method, request.url);

    for (const [name, value] of Object.entries(request.headers)) {
      // exclude browser managed headers if any were sent
      if (!browserManagedHeaders.has(name.toLowerCase())) {
        xhr.setRequestHeader(name, value);
      }
    }

    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        onProgress(
          event.lengthComputable ? event.loaded : 0,
          event.lengthComputable ? event.total : 0,
        );
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });
    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed because of a network error"));
    });
    xhr.addEventListener("abort", () => {
      reject(new DOMException("Upload was aborted", "AbortError"));
    });

    xhr.send(file);
  });
}

export async function uploadAudiofile(
  file: File,
  playlistId: Playlist["id"],
  options?: UploadAudiofileOptions,
) {
  const upload = await createUpload({
    body: {
      content_length: file.size,
      filename: file.name,
      playlist_id: playlistId,
    },
  });

  await uploadToSignedUrl(file, upload, options?.onProgress);
  await confirmUpload({ body: { task_id: upload.task_id } });
}
