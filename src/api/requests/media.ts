import axiosClient from "../axiosClient";

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

export async function uploadAudioFile(
  formData: FormData
  // config?: RequestConfig
) {
  return await axiosClient.post("/media/audioFile/0", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export async function uploadPlaylistAudioFile(
  /**
   * Used for both a playlist and shared playlist
   * Server knows type based on the playlist audiofile type param
   */
  formData: FormData,
  playlistID: string,
  audioFileType: string | number
) {
  return await axiosClient.post(
    `/media/audioFile/${audioFileType}/${playlistID}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
}

export async function uploadProfilePicture(formData: FormData) {
  return await axiosClient.put("/user/profilePicture", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export async function createPlaylist(playlistName: string) {
  const response = await axiosClient.post("/media/1", {
    name: playlistName,
  });
  return response.data;
}

export async function createSharedPlaylist(playlistName: string) {
  const response = await axiosClient.post("/media/3", {
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
