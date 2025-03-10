import axiosClient, { STREAMING_API_URL } from "../axiosClient";
import { Playlist, Audiofile } from "../types/media";
import { PlaylistInvite } from "../types/invites";
import { checkRequestAuth } from "@/auth/state";

///////////////////////////////////////////////////////////////////////////
// AUDIOFILE
///////////////////////////////////////////////////////////////////////////

export type FileUploadResultEvent = {
  id: number;
  filename: string;
  event: "error" | "success";
  data: any;
};
export type FileUploadDoneEvent = {
  event: "done";
};

export type AudiofileUploadCallbacks = {
  onError: (error: any) => any;
  onSuccess: (e: FileUploadResultEvent) => any;
};

export async function uploadAudioFile(
  files: FileList,
  playlistID: number,
  callbacks?: AudiofileUploadCallbacks,
) {
  const method = "POST";
  const endpoint = `/audiofiles/${playlistID}`;

  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  // since this endpoint does not use axios, we have to explicitly do an auth check
  try {
    const token = await checkRequestAuth({ url: endpoint, method });
    const res = await fetch(STREAMING_API_URL + endpoint, {
      method,
      headers: {
        Authorization: "Bearer " + token,
      },
      // browser will auto-set the content type and include the multipart boundary
      body: formData,
    });

    if (!res.body) {
      throw new Error("Body not found in reponse");
    }

    // parse the body and split the events
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();

    if (callbacks) {
      await handleUploadEvents(reader, callbacks);
    }
  } catch (error) {
    callbacks?.onError(error);
    return;
  }
}

async function handleUploadEvents(
  reader: ReadableStreamDefaultReader<string>,
  callbacks: AudiofileUploadCallbacks,
) {
  // String buffer to write store a single json payload.
  // Concantentation is fine since most json objects are small and there is only a few.
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    // start of the unprocessed part of the value
    let start = 0;
    while (true) {
      let newline_idx = value.indexOf("\n", start);
      if (newline_idx === -1) {
        // message slice is either empty or without newline (incomplete)
        buf += value.slice(start);
        break;
      } else {
        buf += value.slice(start, newline_idx);
        // process the event and clear the buffer
        const event = JSON.parse(buf) as
          | FileUploadResultEvent
          | FileUploadDoneEvent;
        if (event.event === "success") {
          callbacks.onSuccess(event);
        } else if (event.event === "error") {
          callbacks.onError(event);
        } else {
          throw new Error("Unexpected event");
        }
        buf = "";

        // overflows are well handled by String.indexOf() and String.slice()
        start = newline_idx + 1;
      }
    }
  }
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
  const respose = await axiosClient.get<Audiofile[]>(
    `/playlists/${playlistID}/audiofiles`,
  );
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
  const response = await axiosClient.get<PlaylistInvite[]>(
    `/playlist-invites`,
    { params },
  );
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

export async function addListeningHistory(audioFileID: number) {
  const response = await axiosClient.post(`/history/audiofiles/${audioFileID}`);
  return response.data;
}
