import axiosClient from "../axiosClient";

export async function deleteAudioFile(
  audioFile: AudioFile | PlaylistAudioFile,
  config: RequestConfig
) {
  let requestURL: string;
  if (audioFile.type === 0) {
    requestURL = `/media/0/${audioFile._id}`;
  } else if (audioFile.type === 2) {
    // audioFile in a playlist
    requestURL = `/media/2/${audioFile._id}/${
      (audioFile as PlaylistAudioFile).playlistID
    }`;
  } else {
    return;
  }
  return await axiosClient.delete(requestURL, {
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
    },
  });
}

export async function deletePlaylist(
  playlist: Playlist,
  config: RequestConfig
) {
  return await axiosClient.delete(`/media/1/${playlist._id}`, {
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
    },
  });
}

export async function uploadAudioFile(
  formData: FormData,
  config: RequestConfig
) {
  return await axiosClient.post("/media/0", formData, {
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "multipart/form-data",
    },
  });
}

export async function uploadPlaylistAudioFile(
  formData: FormData,
  playlist: Playlist,
  config: RequestConfig
) {
  return await axiosClient.post(`/media/2/${playlist._id}`, formData, {
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "multipart/form-data",
    },
  });
}

export async function uploadProfilePicture(
  formData: FormData,
  config: RequestConfig
) {
  return await axiosClient.put("/user/profilePicture", formData, {
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "multipart/form-data",
    },
  });
}