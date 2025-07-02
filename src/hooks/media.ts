import { useQuery } from "@tanstack/react-query";
import {
  deleteAudioFile,
  deletePlaylist,
  FileUploadResultEvent,
  getAudioFileHistory,
  getMostPlayedAudioFiles,
  getPlaylistAudiofiles,
  getPlaylistInfo,
  uploadAudioFile,
} from "../api/requests/media";
import { useStore } from "../store/store";
import { MediaTask, TaskType } from "../store/types";
import { Playlist, Audiofile } from "@/api/types/media";
import { toast } from "sonner";
import { queryClient } from "@/routes/_authenticated";

// store and cache keys
// These keys are used to access / update data in the
// react-query layer. They are also sometimes used in our client
// side cache. In these cases they are returned to the caller so
// they can observe changes on that value as queries update it.
const MOST_PLAYED_STORE_KEY = "most-played";
const LISTENING_HISTORY_STORE_KEY = "listening-history";

export function getPlaylistMediaStoreKey(playlist_id: number) {
  const PLAYLIST_AUDIOFILES_STORE_KEY_PREFIX = "playlist-audiofiles";
  return PLAYLIST_AUDIOFILES_STORE_KEY_PREFIX + "-" + playlist_id;
}

export function getPlaylistInfoStoreKey(playlist_id: number) {
  const PLAYLIST_INFO_STORE_KEY_PREFIX = "playlist-info";
  return PLAYLIST_INFO_STORE_KEY_PREFIX + "-" + playlist_id;
}

export function usePlaylistInfo(playlistId: number) {
  const key = getPlaylistInfoStoreKey(playlistId);
  const query = useQuery({
    queryKey: [key],
    queryFn: async () => getPlaylistInfo(playlistId),
  });
  return { ...query } as const;
}

export function usePlaylistAudioFiles(playlistId: number) {
  const key = getPlaylistMediaStoreKey(playlistId);
  const setMediaList = useStore((state) => state.setMediaList);
  const query = useQuery({
    queryKey: [key],
    queryFn: async () => {
      const data = await getPlaylistAudiofiles(playlistId);
      setMediaList(key, data);
      return data;
    },
  });
  return { ...query, key } as const;
}

export function useMostPlayed(limit = 10) {
  const setMediaList = useStore((state) => state.setMediaList);
  const query = useQuery({
    queryKey: [MOST_PLAYED_STORE_KEY],
    queryFn: async () => {
      const data = await getMostPlayedAudioFiles(limit);
      setMediaList(MOST_PLAYED_STORE_KEY, data);
      return data;
    },
  });
  return { ...query, key: MOST_PLAYED_STORE_KEY } as const;
}

export function useListeningHistory(limit = 10, skip?: number) {
  const setMediaList = useStore((state) => state.setMediaList);
  const query = useQuery({
    queryKey: [LISTENING_HISTORY_STORE_KEY],
    queryFn: async () => {
      const data = await getAudioFileHistory(limit, skip);
      setMediaList(LISTENING_HISTORY_STORE_KEY, data);
      return data;
    },
  });
  return { ...query, key: LISTENING_HISTORY_STORE_KEY } as const;
}

function genTaskId() {
  if (window.isSecureContext) {
    return crypto.randomUUID();
  } else {
    // fallback for browser versions that do not consider
    // locally served content as secure contexts. (Ex. Firefox versions before 84)
    return `${Date.now().toString()}-${Math.round(Math.random() * 1000).toString()}`;
  }
}

export function useUploadAudioFile() {
  const setTask = useStore((state) => state.setTask);
  const removeTask = useStore((state) => state.removeTask);

  return function (files: File[], playlist: Playlist) {
    toast("Uploading audio files", {
      description:
        "This may take a while. You can monitor progress from your tasks list",
    });

    // keeps a mapping of the index of the file and its taskId
    // so that we can clear it once it is done
    const taskIdxToId: Record<number, string> = {};

    function resolveFilename(e: any) {
      if (e.id && e.event) {
        if (e.filename) {
          return e.filename;
        } else {
          return files[e.id].name;
        }
      }
    }
    function onError(e: any) {
      let description = resolveFilename(e);

      if (!description) {
        description = e.message || "unexpected error";
      }
      if (e.id) {
        removeTask(taskIdxToId[e.id]);
      }
      toast("Upload error", { description });
    }

    function onSuccess(e: FileUploadResultEvent) {
      toast("Upload successul", {
        description: `"${e.filename}" successfully uploaded`,
      });
      removeTask(taskIdxToId[e.id]);
      const playlist_key = getPlaylistMediaStoreKey(playlist.id);
      queryClient.invalidateQueries({
        queryKey: [playlist_key],
      });
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const taskId = genTaskId();
      const task: MediaTask = {
        type: TaskType.MediaTask,
        title: `Uploading "${file.name}"`,
        media: playlist,
      };
      setTask(taskId, task);
      taskIdxToId[i] = taskId;
    }

    // This function should not throw an error. It catches  all errors
    // and invokes the apppropriate callback
    uploadAudioFile(files, playlist.id, { onError, onSuccess });
  };
}

export function useDeleteAudioFile() {
  const removeTask = useStore((state) => state.removeTask);
  const setTask = useStore((state) => state.setTask);

  return async function (audiofile: Audiofile) {
    const playlist_key = getPlaylistMediaStoreKey(audiofile.playlist_id);
    const taskId = genTaskId();
    const task: MediaTask = {
      type: TaskType.MediaTask,
      title: "Deleting audio file: " + audiofile.filename,
      media: audiofile,
    };

    setTask(taskId, task);
    try {
      await deleteAudioFile(audiofile.id);
      queryClient.invalidateQueries({
        queryKey: [playlist_key],
      });
    } catch (error) {
      throw error;
    } finally {
      removeTask(taskId);
    }
  };
}

export function useDeletePlaylist() {
  const removeTask = useStore((state) => state.removeTask);
  const setTask = useStore((state) => state.setTask);
  const removeMediaList = useStore((state) => state.removeMediaList);

  return async function (playlist: Playlist) {
    toast(`Deleting playlist "${playlist.name}"`, {
      description: "This may take a while",
    });
    const taskId = genTaskId();
    const task: MediaTask = {
      type: TaskType.MediaTask,
      title: "Deleting playlist",
      media: playlist,
    };

    setTask(taskId, task);
    try {
      await deletePlaylist(playlist.id);
      toast("Playlist deleted successfully");
      removeMediaList(getPlaylistMediaStoreKey(playlist.id));
    } catch (error) {
      toast("Error deleting playlist");
      throw error;
    } finally {
      removeTask(taskId);
    }
  };
}
