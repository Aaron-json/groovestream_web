import axiosClient, { PRIMARY_API_URL } from "../axiosClient";
import { Playlist, Audiofile, AudioDeliverable } from "../types/media";
import { PlaylistInvite } from "../types/invites";
import axios, { AxiosRequestConfig } from "axios";
import { User } from "../types/user";

///////////////////////////////////////////////////////////////////////////
// AUDIOFILE
///////////////////////////////////////////////////////////////////////////

type CreateUploadResponse = {
  url: string;
  headers: Record<string, string>;
  method: string;
  task_id: string;
  object_id: string;
};
export async function createUpload(file: File, playlist_id: Playlist["id"]) {
  const res = await axiosClient.post<CreateUploadResponse>("/upload/url", {
    filename: file.name,
    playlist_id,
    content_length: file.size,
  });
  return res.data;
}

export async function confirmUpload(task_id: string) {
  return axiosClient.post("/upload/confirm", {
    task_id,
  });
}

type UploadAudiofileOptions = {
  onProgress?: (current: number, total: number) => any;
};
export async function uploadAudiofile(
  file: File,
  playlist_id: Playlist["id"],
  options?: UploadAudiofileOptions,
) {
  const url_response = await createUpload(file, playlist_id);

  const config: AxiosRequestConfig = {};
  config.headers = {
    "Content-Type": "application/octet-stream",
    // avoid overwriting existing objects
    "If-None-Match": "*",
  };

  const onProgressCallback = options?.onProgress;
  if (onProgressCallback) {
    config.onUploadProgress = (e) => {
      if (e.lengthComputable && e.total) {
        onProgressCallback(e.loaded, e.total);
      } else {
        onProgressCallback(0, 0);
      }
    };
  }

  await axios.put(url_response.url, file, config);

  await confirmUpload(url_response.task_id);
}

export type CloudTaskStatus =
  | "UNCONFIRMED"
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export type CloudTaskType = "AUDIO_UPLOAD";

export type AudioUploadTaskPayload = {
  playlist_id: Playlist["id"];
  object_id: string;
  user_id: User["id"];
  filename: string;
  task_id: string;
};

export type CloudTaskPayload = AudioUploadTaskPayload;

export interface CloudTask {
  id: string;
  status: CloudTaskStatus;
  type: CloudTaskType;
  payload: CloudTaskPayload;
  user_id: User["id"] | null;
  error: string | null;
  unconfirmed_expires_at: string;
  status_updated_at: string;
  created_at: string;
}

export async function getCloudTasks() {
  const res = await axiosClient.get<CloudTask[]>("/tasks");
  return res.data;
}

export async function deleteAudioFile(audioFileID: Audiofile["id"]) {
  return axiosClient.delete(`/audiofiles/${audioFileID}`);
}

export async function getDeliverables(audiofileId: Audiofile["id"]) {
  const response = await axiosClient.get<AudioDeliverable[]>(
    `/audiofiles/${audiofileId}/deliverables`,
  );
  return response.data;
}

export type DeliverableTokenResponse = {
  token: string;
};
export async function getDeliverableToken(deliverableId: AudioDeliverable["id"]) {
  const response = await axiosClient.get<DeliverableTokenResponse>(
    `/audiofiles/deliverables/${deliverableId}/token`,
  );
  return response.data;
}

// Requests a signed url to the object
export async function getObjectSignedUrl(objectId: string) {
  let url = `/audiofiles/object/${objectId}/url`;

  const response = await axiosClient.get<string>(url, {
    timeout: 1000 * 60 * 2,
    responseType: "text",
  });
  return response.data;
}

// Returns an HTTP url to get the object. Authorization headers
// must be added manually.
export function getObjectUrl(objectId: string) {
  let url = `${PRIMARY_API_URL}/audiofiles/object/${objectId}`;
  return url;
}

//////////////////////////////////////////////////////////////////////////////////////
// PLAYLIST
/////////////////////////////////////////////////////////////////////////////////////
export async function deletePlaylist(playlistID: Playlist["id"]) {
  return await axiosClient.delete(`/playlists/${playlistID}`);
}

export async function createPlaylist(playlistName: string) {
  const response = await axiosClient.post(`/playlists`, {
    name: playlistName,
  });
  return response.data;
}

export async function getPlaylistAudiofiles(playlistID: Playlist["id"]) {
  const respose = await axiosClient.get<Audiofile[]>(
    `/playlists/${playlistID}/audiofiles`,
  );
  return respose.data;
}
export async function getPlaylistInfo(playlistID: Playlist["id"]) {
  const respose = await axiosClient.get<Playlist>(`/playlists/${playlistID}`);
  return respose.data;
}
export async function getUserPlaylists(searchText?: string | undefined) {
  const response = await axiosClient.get<Playlist[]>("/playlists", {
    params: { searchText },
  });
  return response.data;
}
/////////////////////////////////////////////////////////////////////////////////////////////
// SHARED PLAYLISTS
/////////////////////////////////////////////////////////////////////////////////////////////
export async function getPlaylistInvites(limit: number, skip?: number) {
  const params: any = {};
  params.limit = limit;
  if (skip) {
    params.skip = skip;
  }
  const response = await axiosClient.get<PlaylistInvite[]>(
    `/playlist-invites`,
    { params },
  );
  return response.data;
}
export async function sendPlaylistInvite(
  playlistID: Playlist["id"],
  username: string,
) {
  const response = await axiosClient.post(`/playlist-invites`, {
    playlist_id: playlistID,
    username,
  });
  return response.data;
}

export async function acceptPlaylistInvite(
  senderID: User["id"],
  playlistID: Playlist["id"],
) {
  const response = await axiosClient.post(
    `/playlist-invites/${playlistID}/${senderID}/accept`,
  );
  return response.data;
}

export async function rejectPlaylistInvite(
  senderID: User["id"],
  playlistID: Playlist["id"],
) {
  const response = await axiosClient.delete(
    `/playlist-invites/${playlistID}/${senderID}`,
  );
  return response.data;
}

export async function leavePlaylist(playlistID: Playlist["id"]) {
  const response = await axiosClient.delete(`/playlist-members/${playlistID}`);
  return response.data;
}
export async function removePlaylistMember(
  playlistID: Playlist["id"],
  memberID: User["id"],
) {
  const response = await axiosClient.delete(
    `/playlist-members/${playlistID}/${memberID}`,
  );
  return response.data;
}

////////////////////////////////////////////////////////////////////////////////////
// ANALYTICS
////////////////////////////////////////////////////////////////////////////////////

export async function getMostPlayedAudioFiles(limit: number) {
  const response = await axiosClient.get<Audiofile[]>(
    "/analytics/audiofiles/most-played",
    {
      params: { limit },
    },
  );
  return response.data as Audiofile[];
}

export async function getAudioFileHistory(limit: number, skip?: number) {
  const queryParams: {
    limit: number;
    skip?: number;
  } = {
    limit,
  };
  if (skip !== undefined && skip !== null) {
    queryParams.skip = skip;
  }
  const response = await axiosClient.get<Audiofile[]>(`/history/audiofiles`, {
    params: queryParams,
  });
  return response.data;
}

export async function addListeningHistory(audioFileID: Audiofile["id"]) {
  const response = await axiosClient.post(`/history/audiofiles/${audioFileID}`);
  return response.data;
}
