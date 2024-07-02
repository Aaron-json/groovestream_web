import { AxiosRequestConfig, ResponseType } from "axios";
import axiosClient, { STREAMING_API_URL } from "../axiosClient";
import { MediaTask, TaskType } from "../../contexts/TasksContext";
import { AudioFile, Playlist } from "../../types/media";
import { PlaylistInvite } from "../../types/invites";
import { TaskConfig } from "./types";

///////////////////////////////////////////////////////////////////////////
// AUDIOFILE
///////////////////////////////////////////////////////////////////////////
export async function uploadAudioFile(
  formData: FormData,
  playlistID: number,
  taskConfig: TaskConfig
) {
  const taskID = Date.now().toString + (Math.random() * 100).toString();
  const task: MediaTask = {
    type: TaskType.Media,
    name: "Uploading audio files",
    progress: 0,
    playlistID,
  }
  // set up the request config including the onUploadProgress event handler
  let config: AxiosRequestConfig = {
    baseURL: STREAMING_API_URL,
    headers: {
      "Content-Type": "multipart/form-data",
    },
    // set a custom timeout since the default may be too short for downloads
    timeout: 1000 * 60 * 5,
    onUploadProgress: (progressEvent) => {
      // add the mode manually to TS knowns its a progressing task
      taskConfig.updateTask(taskID, { ...task, progress: progressEvent.progress! })
    },
  };

  taskConfig.addTask(taskID, task)
  try {
    const url = `/media/0/${playlistID}`;

    const response = await axiosClient.post(
      url,
      formData,
      config
    );
    return response
  } catch (error) {
    throw error
  } finally {
    taskConfig.removeTask(taskID)
  }
}

export async function deleteAudioFile(
  audioFileID: number,
  storageID: string,
) {
  return await axiosClient.delete(`/media/0/${audioFileID}/${storageID}`);
}
export async function streamAudioFile(
  storageID: string,
  responseType: ResponseType
) {
  let url = `/media/stream/${storageID}`;
  // set a custom timeout since the default may be too short for downloads
  // uses a different server than the standad
  const response = await axiosClient.get(url, { timeout: 1000 * 60 * 2, baseURL: STREAMING_API_URL, responseType })
  return response.data;
}

//////////////////////////////////////////////////////////////////////////////////////
// PLAYLIST
/////////////////////////////////////////////////////////////////////////////////////
export async function deletePlaylist(
  playlistID: number,
  taskConfig?: TaskConfig
) {
  const taskID = Date.now().toString + (Math.random() * 100).toString();
  const task: MediaTask = {
    type: TaskType.Media,
    name: "Deleting playlist",
    playlistID,
  }
  try {
    taskConfig?.addTask(taskID, task)
    return await axiosClient.delete(`/media/1/${playlistID}`);

  } catch (error) {
    throw error
  } finally {
    taskConfig?.removeTask(taskID)
  }
}

export async function createPlaylist(
  playlistName: string,
) {
  const response = await axiosClient.post(`/media/1`, {
    name: playlistName,
  });
  return response.data;
}

export async function getPlaylistAudioFiles(
  playlistID: number
) {
  const respose = await axiosClient.get(`/media/1/${playlistID}`);
  return respose.data as AudioFile[];
}
export async function getPlaylistInfo(playlistID: number) {
  const respose = await axiosClient.get(`/media/info/1/${playlistID}`);
  return respose.data as Playlist;

}
/////////////////////////////////////////////////////////////////////////////////////////////
// ALL MEDIA
/////////////////////////////////////////////////////////////////////////////////////////////
export async function getUserPlaylists(searchText?: string | undefined) {
  const response = await axiosClient.get("/media", {
    params: { searchText }
  });
  return response.data as (Playlist | AudioFile)[];
}
/////////////////////////////////////////////////////////////////////////////////////////////
// SHARED PLAYLIST SPECIFIC
/////////////////////////////////////////////////////////////////////////////////////////////
export async function getPlaylistInvites() {
  const response = await axiosClient.get(`/social/playlist-invites`);
  return response.data as Omit<PlaylistInvite, "to">[];
}
export async function sendPlaylistInvite(
  playlistID: number,
  username: string
) {
  const response = await axiosClient.post(`/social/playlist-invite/${playlistID}`, {
    username,
  });
  return response.data;
}

export async function acceptPlaylistInvite(
  senderID: number,
  playlistID: number,
  inviteID: number
) {
  const response = await axiosClient.post(
    `/social/playlist-member/${inviteID}/${playlistID}`
  );
  return response.data;
}

export async function rejectPlaylistInvite(
  senderID: number,
  playlistID: number,
  inviteID: number
) {
  const response = await axiosClient.delete(
    `/social/playlist-invite/${inviteID}/${playlistID}`
  );
  return response.data;
}

export async function leavePlaylist(playlistID: number) {
  const response = await axiosClient.delete(`/social/playlist-member/${playlistID}`);
  return response.data;
}
export async function removePlaylistMember(
  playlistID: number,
  memberID: number
) {
  const response = await axiosClient.delete(
    `/social/playlist-member/${playlistID}/${memberID}`
  );
  return response.data;
}

////////////////////////////////////////////////////////////////////////////////////
// ANALYTICS
////////////////////////////////////////////////////////////////////////////////////

export async function getMostPlayedAudioFiles(limit: number) {
  const response = await axiosClient.get(
    "/media/audiofile/most-played",
    { params: { limit } }
  );
  return response.data as AudioFile[];
}

export async function getAudioFileHistory(limit: number, skip?: number) {
  const queryParams: {
    limit: number,
    skip?: number
  } = {
    limit
  }
  if (skip) {
    queryParams.skip = skip
  }
  const response = await axiosClient.get(
    `/media/audiofile/history`, {
    params: queryParams
  }
  );
  return response.data as AudioFile[];
}

export async function addListeningHistory(audioFileID: number) {
  const response = await axiosClient.post(`/media/audiofile/history/${audioFileID}`)
  return response.data
}
