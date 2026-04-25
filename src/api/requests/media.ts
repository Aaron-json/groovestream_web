import axiosClient, { PRIMARY_API_URL } from "../api";
import axios, { AxiosRequestConfig } from "axios";
import { components } from "../types/schema";
import { OpBundle, ApiOp } from "../types/helpers";
import { User } from "./user";

// Domain Types
export type Audiofile = components["schemas"]["AudiofileView"];
export type Playlist = components["schemas"]["PlaylistView"];
export type AudioDeliverable = components["schemas"]["GetDeliverablesRow"];
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
  return axiosClient.post<ConfirmUpload["Response"]>(
    "/upload/confirm",
    body,
  );
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
export type GetAudiofileMetadataError = GetAudiofileMetadata["Error"];
export async function getAudiofileMetadata(path: GetAudiofileMetadata["Path"]) {
  const response = await axiosClient.get<GetAudiofileMetadata["Response"]>(
    `/audiofiles/${path.audiofile_id}/metadata`,
  );
  return response.data;
}

type ListAudiofilesDeliverables = ApiOp<"list-audiofiles-by-audiofile-id-deliverables">;
type ListAudiofilesDeliverablesBundle = OpBundle<ListAudiofilesDeliverables>;
export type ListAudiofilesDeliverablesError = ListAudiofilesDeliverablesBundle["Error"];
export async function getDeliverables(path: ListAudiofilesDeliverablesBundle["Path"]) {
  const response = await axiosClient.get<ListAudiofilesDeliverablesBundle["Response"]>(
    `/audiofiles/${path.audiofile_id}/deliverables`,
  );
  return response.data;
}

type GetDeliverableToken = OpBundle<"get-audiofiles-deliverables-by-deliverable-id-token">;
export type GetDeliverableTokenError = GetDeliverableToken["Error"];
export async function getDeliverableToken(path: GetDeliverableToken["Path"]) {
  const response = await axiosClient.get<GetDeliverableToken["Response"]>(
    `/audiofiles/deliverables/${path.deliverable_id}/token`,
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

type DeletePlaylist = OpBundle<"delete-playlists-by-playlist-id">;
export type DeletePlaylistError = DeletePlaylist["Error"];
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

type ListPlaylistAudiofiles = OpBundle<"list-playlists-by-playlist-id-audiofiles">;
export async function getPlaylistAudiofiles(
  path: ListPlaylistAudiofiles["Path"],
  params?: ListPlaylistAudiofiles["Query"],
) {
  const respose = await axiosClient.get<ListPlaylistAudiofiles["Response"]>(
    `/playlists/${path.playlist_id}/audiofiles`,
    { params },
  );
  return respose.data;
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

type ListPlaylists = OpBundle<"list-playlists">;
export async function getUserPlaylists(params?: ListPlaylists["Query"]) {
  const response = await axiosClient.get<ListPlaylists["Response"]>(
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

type ListPlaylistInvites = OpBundle<"list-playlist-invites">;
export type ListPlaylistInvitesError = ListPlaylistInvites["Error"];
export async function getPlaylistInvites(params: ListPlaylistInvites["Query"]) {
  const response = await axiosClient.get<ListPlaylistInvites["Response"]>(
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

type AcceptInvite = OpBundle<"post-playlist-invites-by-playlist-id-by-playlist-invite-sender-id-accept">;
export type AcceptPlaylistInviteError = AcceptInvite["Error"];
export async function acceptPlaylistInvite(path: AcceptInvite["Path"]) {
  const response = await axiosClient.post<AcceptInvite["Response"]>(
    `/playlist-invites/${path.playlist_id}/${path.playlist_invite_sender_id}/accept`,
  );
  return response.data;
}

type RejectInvite = OpBundle<"delete-playlist-invites-by-playlist-id-by-playlist-invite-sender-id">;
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

type RemoveMember = OpBundle<"delete-playlists-by-playlist-id-members-by-member-id">;
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

type ListHistory = OpBundle<"list-history-audiofiles">;
export async function getAudioFileHistory(params: ListHistory["Query"]) {
  const response = await axiosClient.get<ListHistory["Response"]>(
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
