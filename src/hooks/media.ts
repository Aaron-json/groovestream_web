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

// store and cache keys
// These keys are used to access / update data in the
// react-query layer. They are also sometimes used in our client
// side cache. In these cases they are returned to the caller so
// they can observe changes on that value as queries update it.
const PLAYLIST_AUDIOFILES_STORE_KEY_PREFIX = "playlist-audiofiles";
const PLAYLIST_INFO_STORE_KEY_PREFIX = "playlist-info";
const MOST_PLAYED_STORE_KEY = "most-played";
const LISTENING_HISTORY_STORE_KEY = "listening-history";

export function usePlaylistInfo(playlistId: number) {
  const key = PLAYLIST_INFO_STORE_KEY_PREFIX + "-" + playlistId.toString();
  const query = useQuery({
    queryKey: [key],
    queryFn: async () => getPlaylistInfo(playlistId),
  });
  return { ...query } as const;
}

export function usePlaylistAudioFiles(playlistId: number) {
  const key =
    PLAYLIST_AUDIOFILES_STORE_KEY_PREFIX + "-" + playlistId.toString();
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

  return function (files: FileList, playlist: Playlist) {
    toast("Uploading audio files", {
      description: "This may take a while...",
    });

    // keeps a mapping of the index of the file and its taskId
    // so that we can clear it once it is done
    const taskIdxToId: Record<number, string> = {};
    function onError(e: any) {
      if (e.filename && e.id && e.event) {
        // an upload error event
        toast("Upload error", {
          description: `Uploading "${e.filename}"`,
        });
        removeTask(taskIdxToId[e.id]);
      } else {
        // other generic error
        toast("Upload error", {
          description: e.message || "Unexpected error",
        });
      }
    }

    function onSuccess(e: FileUploadResultEvent) {
      toast("Upload successul", {
        description: `"${e.filename}" successfully uploaded`,
      });
      removeTask(taskIdxToId[e.id]);
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
    const taskId = genTaskId();
    const task: MediaTask = {
      type: TaskType.MediaTask,
      title: "Deleting audio file: " + audiofile.filename,
      media: audiofile,
    };

    setTask(taskId, task);
    try {
      await deleteAudioFile(audiofile.id);
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
    } catch (error) {
      toast("Error deleting playlist");
      throw error;
    } finally {
      removeTask(taskId);
    }
  };
}
