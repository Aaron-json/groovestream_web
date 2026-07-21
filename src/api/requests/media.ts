import axiosClient, { PRIMARY_API_URL } from "../api";
import axios, { AxiosRequestConfig } from "axios";
import { components } from "../types/schema";
import { OpBundle } from "../types/helpers";
import { User } from "./user";

// Domain Types
export type Audiofile = components["schemas"]["AudiofileView"];
export type Playlist = components["schemas"]["PlaylistView"];
export type Media = Audiofile | Playlist;

export type PlaylistInvite = components["schemas"]["PlaylistInviteView"];
export type PlaylistMember = components["schemas"]["PlaylistMemberView"];

export function isAudiofile(media: Media): media is Audiofile {
  return "filename" in media;
}

///////////////////////////////////////////////////////////////////////////
// AUDIOFILE
///////////////////////////////////////////////////////////////////////////

type CreateUpload = OpBundle<"post-upload-url">;
export type CreateUploadError = CreateUpload["Error"];
export async function createUpload(body: CreateUpload["Body"]) {
  const res = await axiosClient.post<CreateUpload["Response"]>(
    "/upload/url",
    body,
  );
  return res.data;
}

type ConfirmUpload = OpBundle<"post-upload-confirm">;
export type ConfirmUploadError = ConfirmUpload["Error"];
export async function confirmUpload(body: ConfirmUpload["Body"]) {
  return axiosClient.post<ConfirmUpload["Response"]>("/upload/confirm", body);
}

type UploadAudiofileOptions = {
  onProgress?: (current: number, total: number) => void;
};
export async function uploadAudiofile(
  file: File,
  playlist_id: string,
  options?: UploadAudiofileOptions,
) {
  const url_response = await createUpload({
    filename: file.name,
    playlist_id,
    content_length: file.size,
  });

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

  await confirmUpload({ task_id: url_response.task_id });
}

type ListTasks = OpBundle<"list-tasks">;
export type CloudTask = NonNullable<ListTasks["Response"]>[number];
export type ListTasksError = ListTasks["Error"];

export type AudioUploadTaskPayload = {
  playlist_id: Playlist["id"];
  object_id: string;
  user_id: User["id"];
  filename: string;
  task_id: string;
};

export async function getCloudTasks() {
  const res = await axiosClient.get<ListTasks["Response"]>("/tasks");
  return res.data;
}

type DeleteAudioFile = OpBundle<"delete-audiofiles-by-audiofile-id">;
export type DeleteAudioFileError = DeleteAudioFile["Error"];
export async function deleteAudioFile(path: DeleteAudioFile["Path"]) {
  return axiosClient.delete<DeleteAudioFile["Response"]>(
    `/audiofiles/${path.audiofile_id}`,
  );
}

type GetAudiofileMetadata = OpBundle<"get-audiofiles-by-audiofile-id-metadata">;
export async function getAudiofileMetadata(path: GetAudiofileMetadata["Path"]) {
  const response = await axiosClient.get<GetAudiofileMetadata["Response"]>(
    `/audiofiles/${path.audiofile_id}/metadata`,
  );
  return response.data;
}

export type ListAudiofilesEncodingsBundle =
  OpBundle<"list-audiofiles-by-audiofile-id-encodings">;
export async function getEncodings(
  path: ListAudiofilesEncodingsBundle["Path"],
) {
  const response = await axiosClient.get<
    ListAudiofilesEncodingsBundle["Response"]
  >(`/audiofiles/${path.audiofile_id}/encodings`);
  return response.data;
}

type GetEncodingToken =
  OpBundle<"get-audiofiles-encodings-by-encoding-id-token">;
export async function getEncodingToken(path: GetEncodingToken["Path"]) {
  const response = await axiosClient.get<GetEncodingToken["Response"]>(
    `/audiofiles/encodings/${path.encoding_id}/token`,
  );
  return response.data;
}

// Requests a signed url to the object
export async function getObjectSignedUrl(objectId: string) {
  const url = `/audiofiles/object/${objectId}/url`;

  const response = await axiosClient.get<string>(url, {
    timeout: 1000 * 60 * 2,
    responseType: "text",
  });
  return response.data;
}

// Returns an HTTP url to get the object. Authorization headers
// must be added manually.
export function getObjectUrl(objectId: string) {
  const url = `${PRIMARY_API_URL}/audiofiles/object/${objectId}`;
  return url;
}

//////////////////////////////////////////////////////////////////////////////////////
// PLAYLIST
/////////////////////////////////////////////////////////////////////////////////////

type DeletePlaylist = OpBundle<"delete-playlists-by-playlist-id">;
export async function deletePlaylist(path: DeletePlaylist["Path"]) {
  const response = await axiosClient.delete<DeletePlaylist["Response"]>(
    `/playlists/${path.playlist_id}`,
  );
  return response.data;
}

type PostPlaylist = OpBundle<"post-playlists">;
export type CreatePlaylistError = PostPlaylist["Error"];
export async function createPlaylist(body: PostPlaylist["Body"]) {
  const response = await axiosClient.post<PostPlaylist["Response"]>(
    `/playlists`,
    body,
  );
  return response.data;
}

type PatchPlaylist = OpBundle<"patch-playlists-by-playlist-id">;
export type UpdatePlaylistError = PatchPlaylist["Error"];
export async function updatePlaylist(
  path: PatchPlaylist["Path"],
  body: PatchPlaylist["Body"],
) {
  const response = await axiosClient.patch<PatchPlaylist["Response"]>(
    `/playlists/${path.playlist_id}`,
    body,
  );
  return response.data;
}

type GetPlaylistAudiofiles =
  OpBundle<"get-playlists-by-playlist-id-audiofiles">;
export async function getPlaylistAudiofiles(
  path: GetPlaylistAudiofiles["Path"],
  params?: GetPlaylistAudiofiles["Query"],
) {
  const response = await axiosClient.get<GetPlaylistAudiofiles["Response"]>(
    `/playlists/${path.playlist_id}/audiofiles`,
    { params },
  );
  return response.data;
}

type GetPlaylistInfo = OpBundle<"get-playlists-by-playlist-id">;
export async function getPlaylistInfo(path: GetPlaylistInfo["Path"]) {
  const respose = await axiosClient.get<GetPlaylistInfo["Response"]>(
    `/playlists/${path.playlist_id}`,
  );
  return respose.data;
}

type ListPlaylistMembers = OpBundle<"list-playlists-by-playlist-id-members">;
export async function getPlaylistMembers(path: ListPlaylistMembers["Path"]) {
  const response = await axiosClient.get<ListPlaylistMembers["Response"]>(
    `/playlists/${path.playlist_id}/members`,
  );
  return response.data;
}

type GetPlaylists = OpBundle<"get-playlists">;
export async function getUserPlaylists(params?: GetPlaylists["Query"]) {
  const response = await axiosClient.get<GetPlaylists["Response"]>(
    "/playlists",
    {
      params,
    },
  );
  return response.data;
}

/////////////////////////////////////////////////////////////////////////////////////////////
// SHARED PLAYLISTS
/////////////////////////////////////////////////////////////////////////////////////////////

type GetPlaylistInvites = OpBundle<"get-playlist-invites">;
export type GetPlaylistInvitesError = GetPlaylistInvites["Error"];
export async function getPlaylistInvites(params: GetPlaylistInvites["Query"]) {
  const response = await axiosClient.get<GetPlaylistInvites["Response"]>(
    `/playlist-invites`,
    { params },
  );
  return response.data;
}

type PostPlaylistInvite = OpBundle<"post-playlist-invites">;
export type PostPlaylistInvitesError = PostPlaylistInvite["Error"];
export async function sendPlaylistInvite(body: PostPlaylistInvite["Body"]) {
  const response = await axiosClient.post<PostPlaylistInvite["Response"]>(
    `/playlist-invites`,
    body,
  );
  return response.data;
}

type AcceptInvite =
  OpBundle<"post-playlist-invites-by-playlist-id-by-playlist-invite-sender-id-accept">;
export type AcceptPlaylistInviteError = AcceptInvite["Error"];
export async function acceptPlaylistInvite(path: AcceptInvite["Path"]) {
  const response = await axiosClient.post<AcceptInvite["Response"]>(
    `/playlist-invites/${path.playlist_id}/${path.playlist_invite_sender_id}/accept`,
  );
  return response.data;
}

type RejectInvite =
  OpBundle<"delete-playlist-invites-by-playlist-id-by-playlist-invite-sender-id">;
export type RejectPlaylistInviteError = RejectInvite["Error"];
export async function rejectPlaylistInvite(path: RejectInvite["Path"]) {
  const response = await axiosClient.delete<RejectInvite["Response"]>(
    `/playlist-invites/${path.playlist_id}/${path.playlist_invite_sender_id}`,
  );
  return response.data;
}

type LeavePlaylist = OpBundle<"delete-playlists-by-playlist-id-members-me">;
export type LeavePlaylistError = LeavePlaylist["Error"];
export async function leavePlaylist(path: LeavePlaylist["Path"]) {
  const response = await axiosClient.delete<LeavePlaylist["Response"]>(
    `/playlists/${path.playlist_id}/members/me`,
  );
  return response.data;
}

type RemoveMember =
  OpBundle<"delete-playlists-by-playlist-id-members-by-member-id">;
export type RemovePlaylistMemberError = RemoveMember["Error"];
export async function removePlaylistMember(path: RemoveMember["Path"]) {
  const response = await axiosClient.delete<RemoveMember["Response"]>(
    `/playlists/${path.playlist_id}/members/${path.member_id}`,
  );
  return response.data;
}

////////////////////////////////////////////////////////////////////////////////////
// ANALYTICS
////////////////////////////////////////////////////////////////////////////////////

type ListMostPlayed = OpBundle<"list-analytics-audiofiles-most-played">;
export async function getMostPlayedAudioFiles(params: ListMostPlayed["Query"]) {
  const response = await axiosClient.get<ListMostPlayed["Response"]>(
    "/analytics/audiofiles/most-played",
    {
      params,
    },
  );
  return response.data;
}

type GetHistory = OpBundle<"get-history-audiofiles">;
export async function getAudioFileHistory(params: GetHistory["Query"]) {
  const response = await axiosClient.get<GetHistory["Response"]>(
    `/history/audiofiles`,
    {
      params,
    },
  );
  return response.data;
}

type PostHistory = OpBundle<"post-history-audiofiles-by-audiofile-id">;
export type AddListeningHistoryError = PostHistory["Error"];
export async function addListeningHistory(path: PostHistory["Path"]) {
  const response = await axiosClient.post<PostHistory["Response"]>(
    `/history/audiofiles/${path.audiofile_id}`,
  );
  return response.data;
}
