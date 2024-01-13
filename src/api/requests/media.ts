import { AxiosRequestConfig } from "axios";
import axiosClient from "../axiosClient";
import { Task } from "../../contexts/TasksContext";

export async function deleteAudioFile(
  mediaType: string | number,
  audioFileID: string,
  playlistID?: string
) {
  let requestURL: string;
  if (mediaType === 0) {
    requestURL = `/media/0/${audioFileID}`;
  } else if (mediaType === 2 || mediaType === 4) {
    // audioFile in a playlist
    requestURL = `/media/${mediaType}/${audioFileID}/${playlistID}`;
  } else {
    return;
  }
  return await axiosClient.delete(requestURL);
}

export async function deletePlaylist(
  playlistType: string | number,
  playlistID: string
) {
  return await axiosClient.delete(`/media/${playlistType}/${playlistID}`);
}

/**
 * Uploads audiofiles to all types of playlists
 * @param formData FormData object
 * @param playlistID
 * @param audioFileType - Type of the playlist audiofile
 * @param onUploadProgress Function to update the upload's progress
 * @returns null
 */
export async function uploadAudioFile(
  formData: FormData,
  audioFileType: 0 | 2 | 4,
  playlistID?: string,
  taskConfig?: {
    task: Task,
    taskID: string,
    addTask: (taskId: string, task: Task) => any
    updateTask: (id: string, updatedTask: Task) => any,
    removeTask: (id: string) => any
  }
) {

  // set up the request config including the onUploadProgress event handler
  let config: AxiosRequestConfig = {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      // add the mode manually to TS knowns its a progressing task
      taskConfig?.updateTask(taskConfig.taskID, { ...taskConfig.task, mode: "progress", progress: progressEvent.progress! })
    },
  };

  let url;
  if (audioFileType === 0) {
    url = `/media/audioFile/0`;
  } else if (audioFileType === 2 || audioFileType === 4) {
    url = `/media/audioFile/${audioFileType}/${playlistID}`;
  } else {
    // unexpected media type
    return;
  }
  console.log("we got here")
  taskConfig?.addTask(taskConfig.taskID, taskConfig.task)
  const response = await axiosClient.post(
    url,
    formData,
    config
  );
  taskConfig?.removeTask(taskConfig.taskID)
  return response
}

export async function uploadProfilePicture(formData: FormData) {
  return await axiosClient.put("/user/profilePicture", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export async function createPlaylist(
  playlistName: string,
  playlistType: number | string
) {
  const response = await axiosClient.post(`/media/${playlistType}`, {
    name: playlistName,
  });
  return response.data;
}

export async function getPlaylistData(
  playlistType: number | string,
  playlistID: string
) {
  // can be used to get non nested media like audiofiles outside playlists,
  // playlists and shared playlists
  const respose = await axiosClient.get(`/media/${playlistType}/${playlistID}`);
  return respose.data;
}

export async function getAllUserMedia() {
  const response = await axiosClient.get("/media");
  return response.data;
}

export async function getPlaylistAudioFileInfo(
  mediaType: number | string,
  playlistID: string,
  audioFileID: string
) {
  // get nested media like playlist audiofiles
  const response = await axiosClient.get(
    `/media/info/${mediaType}/${playlistID}/${audioFileID}`
  );
  return response.data;
}
export async function getPlaylistInvites() {
  const response = await axiosClient.get(`/media/3/invites`);
  return response.data;
}
export async function sendPlaylistInvite(
  playlistID: string,
  memberEmail: string
) {
  const response = await axiosClient.post(`/media/3/invite/${playlistID}`, {
    memberEmail,
  });
  return response.data;
}

export async function acceptPlaylistInvite(
  senderID: string,
  playlistID: string
) {
  const response = await axiosClient.post(
    `/media/3/member/${senderID}/${playlistID}`
  );
  return response.data;
}

export async function rejectPlaylistInvite(
  senderID: string,
  playlistID: string
) {
  const response = await axiosClient.delete(
    `/media/3/invite/${senderID}/${playlistID}`
  );
  return response.data;
}

export async function leavePlaylist(playlistID: string) {
  const response = await axiosClient.delete(`/media/3/member/${playlistID}`);
  return response.data;
}
export async function removePlaylistMember(
  playlistID: string,
  memberID: string
) {
  const response = await axiosClient.delete(
    `/media/3/member/${playlistID}/${memberID}`
  );
  return response.data;
}
export async function streamAudioFile(
  mediaType: number | string,
  audioFileID: string,
  playlistID?: string
) {
  let url;
  if (mediaType === 0 || mediaType === 2) {
    url = `media/${mediaType}/${audioFileID}`;
  } else if (mediaType === 4) {
    url = `media/${mediaType}/${audioFileID}/${playlistID}`;
  } else {
    throw new Error("Invalid media type");
  }
  const response = await axiosClient.get(url);
  return response.data;
}
