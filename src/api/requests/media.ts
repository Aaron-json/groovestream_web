import axiosClient, { PRIMARY_API_URL } from "../api";
import { Playlist, Audiofile, AudioDeliverable } from "../types/media";
import axios, { AxiosRequestConfig } from "axios";
import { User } from "../types/user";
import { operations } from "../types/schema";
import { ApiOpError } from "../types/errors";

///////////////////////////////////////////////////////////////////////////
// AUDIOFILE
///////////////////////////////////////////////////////////////////////////

type CreateUploadResponse =
  operations["post-upload-url"]["responses"]["200"]["content"]["application/json"];
export type CreateUploadError = ApiOpError<"post-upload-url">;

export async function createUpload(file: File, playlist_id: Playlist["id"]) {
  const res = await axiosClient.post<CreateUploadResponse>("/upload/url", {
    filename: file.name,
    playlist_id,
    content_length: file.size,
  });
  return res.data;
}

export type ConfirmUploadError = ApiOpError<"post-upload-confirm">;
export async function confirmUpload(task_id: string) {
  return axiosClient.post<
    operations["post-upload-confirm"]["responses"]["204"]["content"]
  >("/upload/confirm", {
    task_id,
  });
}

type UploadAudiofileOptions = {
  onProgress?: (current: number, total: number) => void;
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

export type CloudTask = NonNullable<
  operations["list-tasks"]["responses"]["200"]["content"]["application/json"]
>[number];
export type ListTasksError = ApiOpError<"list-tasks">;

export type AudioUploadTaskPayload = {
  playlist_id: Playlist["id"];
  object_id: string;
  user_id: User["id"];
  filename: string;
  task_id: string;
};

export async function getCloudTasks() {
  const res = await axiosClient.get<
    operations["list-tasks"]["responses"]["200"]["content"]["application/json"]
  >("/tasks");
  return res.data;
}

export type DeleteAudioFileError = ApiOpError<"delete-audiofiles-by-audiofile-id">;
export async function deleteAudioFile(audioFileID: Audiofile["id"]) {
  return axiosClient.delete<
    operations["delete-audiofiles-by-audiofile-id"]["responses"]["204"]["content"]
  >(`/audiofiles/${audioFileID}`);
}

export type ListAudiofilesDeliverablesError =
  ApiOpError<"list-audiofiles-by-audiofile-id-deliverables">;
export async function getDeliverables(audiofileId: Audiofile["id"]) {
  const response = await axiosClient.get<
    operations["list-audiofiles-by-audiofile-id-deliverables"]["responses"]["200"]["content"]["application/json"]
  >(`/audiofiles/${audiofileId}/deliverables`);
  return response.data;
}

type DeliverableTokenResponse =
  operations["get-audiofiles-deliverables-by-deliverable-id-token"]["responses"]["200"]["content"]["application/json"];
export type GetDeliverableTokenError =
  ApiOpError<"get-audiofiles-deliverables-by-deliverable-id-token">;

export async function getDeliverableToken(
  deliverableId: AudioDeliverable["id"],
) {
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
export type DeletePlaylistError = ApiOpError<"delete-playlists-by-playlist-id">;
export async function deletePlaylist(playlistID: Playlist["id"]) {
  const response = await axiosClient.delete<
    operations["delete-playlists-by-playlist-id"]["responses"]["204"]["content"]
  >(`/playlists/${playlistID}`);
  return response.data;
}

export type CreatePlaylistError = ApiOpError<"post-playlists">;
export async function createPlaylist(playlistName: string) {
  const response = await axiosClient.post<
    operations["post-playlists"]["responses"]["204"]["content"]
  >(`/playlists`, {
    name: playlistName,
  });
  return response.data;
}

export async function getPlaylistAudiofiles(playlistID: Playlist["id"]) {
  const respose = await axiosClient.get<
    operations["list-playlists-by-playlist-id-audiofiles"]["responses"]["200"]["content"]["application/json"]
  >(`/playlists/${playlistID}/audiofiles`);
  return respose.data;
}
export async function getPlaylistInfo(playlistID: Playlist["id"]) {
  const respose = await axiosClient.get<
    operations["get-playlists-by-playlist-id"]["responses"]["200"]["content"]["application/json"]
  >(`/playlists/${playlistID}`);
  return respose.data;
}
export async function getUserPlaylists(searchText?: string | undefined) {
  const response = await axiosClient.get<
    operations["list-playlists"]["responses"]["200"]["content"]["application/json"]
  >("/playlists", {
    params: { searchText },
  });
  return response.data;
}
/////////////////////////////////////////////////////////////////////////////////////////////
// SHARED PLAYLISTS
/////////////////////////////////////////////////////////////////////////////////////////////
export type ListPlaylistInvitesError = ApiOpError<"list-playlist-invites">;
export async function getPlaylistInvites(limit: number, skip?: number) {
  const params: any = {};
  params.limit = limit;
  if (skip) {
    params.skip = skip;
  }
  const response = await axiosClient.get<
    operations["list-playlist-invites"]["responses"]["200"]["content"]["application/json"]
  >(`/playlist-invites`, { params });
  return response.data;
}

export type PostPlaylistInvitesError = ApiOpError<"post-playlist-invites">;
export async function sendPlaylistInvite(
  playlistID: Playlist["id"],
  username: string,
) {
  const response = await axiosClient.post<
    operations["post-playlist-invites"]["responses"]["204"]["content"]
  >(`/playlist-invites`, {
    playlist_id: playlistID,
    username,
  });
  return response.data;
}

export type AcceptPlaylistInviteError =
  ApiOpError<"post-playlist-invites-by-playlist-id-by-playlist-invite-sender-id-accept">;
export async function acceptPlaylistInvite(
  senderID: User["id"],
  playlistID: Playlist["id"],
) {
  const response = await axiosClient.post<
    operations["post-playlist-invites-by-playlist-id-by-playlist-invite-sender-id-accept"]["responses"]["204"]["content"]
  >(`/playlist-invites/${playlistID}/${senderID}/accept`);
  return response.data;
}

export type RejectPlaylistInviteError =
  ApiOpError<"delete-playlist-invites-by-playlist-id-by-playlist-invite-sender-id">;
export async function rejectPlaylistInvite(
  senderID: User["id"],
  playlistID: Playlist["id"],
) {
  const response = await axiosClient.delete<
    operations["delete-playlist-invites-by-playlist-id-by-playlist-invite-sender-id"]["responses"]["204"]["content"]
  >(`/playlist-invites/${playlistID}/${senderID}`);
  return response.data;
}

export type LeavePlaylistError = ApiOpError<"delete-playlists-by-playlist-id-members-me">;
export async function leavePlaylist(playlistID: Playlist["id"]) {
  const response = await axiosClient.delete<
    operations["delete-playlists-by-playlist-id-members-me"]["responses"]["204"]["content"]
  >(`/playlists/${playlistID}/members/me`);
  return response.data;
}

export type RemovePlaylistMemberError =
  ApiOpError<"delete-playlists-by-playlist-id-members-by-member-id">;
export async function removePlaylistMember(
  playlistID: Playlist["id"],
  memberID: User["id"],
) {
  const response = await axiosClient.delete<
    operations["delete-playlists-by-playlist-id-members-by-member-id"]["responses"]["204"]["content"]
  >(`/playlists/${playlistID}/members/${memberID}`);
  return response.data;
}

////////////////////////////////////////////////////////////////////////////////////
// ANALYTICS
////////////////////////////////////////////////////////////////////////////////////

export async function getMostPlayedAudioFiles(limit: number) {
  const response = await axiosClient.get<
    operations["list-analytics-audiofiles-most-played"]["responses"]["200"]["content"]["application/json"]
  >("/analytics/audiofiles/most-played", {
    params: { limit },
  });
  return response.data;
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
  const response = await axiosClient.get<
    operations["list-history-audiofiles"]["responses"]["200"]["content"]["application/json"]
  >(`/history/audiofiles`, {
    params: queryParams,
  });
  return response.data;
}

export type AddListeningHistoryError = ApiOpError<"post-history-audiofiles-by-audiofile-id">;
export async function addListeningHistory(audioFileID: Audiofile["id"]) {
  const response = await axiosClient.post<
    operations["post-history-audiofiles-by-audiofile-id"]["responses"]["204"]["content"]
  >(`/history/audiofiles/${audioFileID}`);
  return response.data;
}
