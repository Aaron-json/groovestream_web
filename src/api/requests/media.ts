import { AxiosProgressEvent, AxiosRequestConfig } from "axios";
import axiosClient, { STREAMING_API_URL } from "../axiosClient";
import { Playlist, Audiofile } from "../../types/media";
import { PlaylistInvite } from "../../types/invites";

///////////////////////////////////////////////////////////////////////////
// AUDIOFILE
///////////////////////////////////////////////////////////////////////////

export async function uploadAudioFile(
  files: FileList,
  playlistID: number,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
) {
  // set up the request config including the onUploadProgress event handler
  let config: AxiosRequestConfig = {
    baseURL: STREAMING_API_URL,
    headers: {
      "Content-Type": "multipart/form-data",
    },
    // set a custom timeout since the default may be too short for uploads
    timeout: 1000 * 60 * 5,
    onUploadProgress,
  };

  const url = `/audiofiles/${playlistID}`;

  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  return axiosClient.post(url, formData, config);
}

export async function deleteAudioFile(audioFileID: number) {
  return axiosClient.delete(`/audiofiles/${audioFileID}`);
}
export async function getObjectUrl(objectId: string) {
  let url = `/audiofiles/object/${objectId}/url`;
  // set a custom timeout since the default may be too short for downloads
  // uses a different server than the standad
  const response = await axiosClient.get<string>(url, {
    timeout: 1000 * 60 * 2,
    baseURL: STREAMING_API_URL,
    responseType: "text",
  });
  return response.data;
}

//////////////////////////////////////////////////////////////////////////////////////
// PLAYLIST
/////////////////////////////////////////////////////////////////////////////////////
export async function deletePlaylist(playlistID: number) {
  return await axiosClient.delete(`/playlists/${playlistID}`);
}

export async function createPlaylist(playlistName: string) {
  const response = await axiosClient.post(`/playlists`, {
    name: playlistName,
  });
  return response.data;
}

export async function getPlaylistAudiofiles(playlistID: number) {
  const respose = await axiosClient.get<Audiofile[]>(`/playlists/${playlistID}/audiofiles`);
  return respose.data;
}
export async function getPlaylistInfo(playlistID: number) {
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
  const response = await axiosClient.get<PlaylistInvite[]>(`/playlist-invites`, { params });
  return response.data;
}
export async function sendPlaylistInvite(playlistID: number, username: string) {
  const response = await axiosClient.post(`/playlist-invites`, {
    playlist_id: playlistID,
    username,
  });
  return response.data;
}

export async function acceptPlaylistInvite(
  senderID: number,
  playlistID: number,
) {
  const response = await axiosClient.post(
    `/playlist-invites/${playlistID}/${senderID}/accept`,
  );
  return response.data;
}

export async function rejectPlaylistInvite(
  senderID: number,
  playlistID: number,
) {
  const response = await axiosClient.delete(
    `/playlist-invites/${playlistID}/${senderID}`,
  );
  return response.data;
}

export async function leavePlaylist(playlistID: number) {
  const response = await axiosClient.delete(`/playlist-members/${playlistID}`);
  return response.data;
}
export async function removePlaylistMember(
  playlistID: number,
  memberID: number,
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
  const response = await axiosClient.get<Audiofile[]>("/analytics/audiofiles/most-played", {
    params: { limit },
  });
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

export async function addListeningHistory(audioFileID: number) {
  const response = await axiosClient.post(`/history/audiofiles/${audioFileID}`);
  return response.data;
}
