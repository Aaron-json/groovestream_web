import { useQuery } from "@tanstack/react-query";
import {
  deleteAudioFile,
  deletePlaylist,
  getAudioFileHistory,
  getMostPlayedAudioFiles,
  getPlaylistAudiofiles,
  getPlaylistInfo,
  uploadAudiofile,
} from "../api/requests/media";
import { MediaTask, NewMediaTask, TaskType, useTaskStore } from "@/lib/tasks";
import { Playlist, Audiofile } from "@/api/types/media";
import { toast } from "sonner";
import { queryClient } from "@/routes/_authenticated";
import { useMediaListStore, useMediaStore } from "@/lib/media";

export type MediaQueryKey = string[];

// Utility function for places where a single string is expected and
// not string[].
function flattenQueryKey(cacheKey: MediaQueryKey) {
  return cacheKey.join();
}

// store and cache keys
// These keys are used to access / update data in the
// react-query and client store layers. react-query uses the
// []string type while the store expects a string.

const MOST_PLAYED_STORE_KEY: MediaQueryKey = ["most-played"];
const LISTENING_HISTORY_STORE_KEY: MediaQueryKey = ["listening-history"];

export function getPlaylistMediaStoreKey(playlist_id: number): MediaQueryKey {
  const PLAYLIST_AUDIOFILES_STORE_KEY_PREFIX = "playlist-audiofiles";
  return [PLAYLIST_AUDIOFILES_STORE_KEY_PREFIX, playlist_id.toString()];
}

export function getPlaylistInfoStoreKey(playlist_id: number): MediaQueryKey {
  const PLAYLIST_INFO_STORE_KEY_PREFIX = "playlist-info";
  return [PLAYLIST_INFO_STORE_KEY_PREFIX, playlist_id.toString()];
}

export function usePlaylistInfo(playlistId: number) {
  const queryKey = getPlaylistInfoStoreKey(playlistId);
  const query = useQuery({
    queryKey,
    queryFn: async () => getPlaylistInfo(playlistId),
  });
  return { ...query } as const;
}

export function usePlaylistAudiofiles(playlistId: number) {
  const queryKey = getPlaylistMediaStoreKey(playlistId);
  const storeKey = flattenQueryKey(queryKey);
  const setMediaList = useMediaListStore((state) => state.setMediaList);
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await getPlaylistAudiofiles(playlistId);
      setMediaList(storeKey, data);
      return data;
    },
  });
  return { ...query, queryKey, storeKey } as const;
}

export function useMostPlayed(limit = 10) {
  const setMediaList = useMediaListStore((state) => state.setMediaList);
  const queryKey = MOST_PLAYED_STORE_KEY;
  const storeKey = flattenQueryKey(queryKey);
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await getMostPlayedAudioFiles(limit);
      setMediaList(storeKey, data);
      return data;
    },
  });
  return { ...query, queryKey, storeKey } as const;
}

export function useListeningHistory(limit = 10, skip?: number) {
  const setMediaList = useMediaListStore((state) => state.setMediaList);
  const queryKey = LISTENING_HISTORY_STORE_KEY;
  const storeKey = flattenQueryKey(queryKey);
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await getAudioFileHistory(limit, skip);
      setMediaList(storeKey, data);
      return data;
    },
  });
  return { ...query, queryKey, storeKey } as const;
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
  const setTask = useTaskStore((state) => state.setTask);
  const removeTask = useTaskStore((state) => state.removeTask);

  return async function (files: File[], playlist: Playlist) {
    toast("Uploading audio files", {
      description:
        "This may take a while. You can monitor progress from your tasks list",
    });

    for (const file of files) {
      let taskId: string;
      try {
        taskId = genTaskId();
        const title = `Uploading "${file.name}"`;
        const task = NewMediaTask(title);
        setTask(taskId, task);
        await uploadAudiofile(file, playlist.id, {
          onProgress: (current, total) => {
            const newTask: MediaTask = {
              ...task,
              progress: {
                current,
                total,
                unit: "bytes",
              },
            };
            setTask(taskId, newTask);
          },
        });
      } catch (err: any) {
        toast("Error uploading file", {
          description: err.message ?? null,
        });
      } finally {
        removeTask(taskId!);
      }
    }
  };
}

export function useDeleteAudioFile() {
  const removeTask = useTaskStore((state) => state.removeTask);
  const setTask = useTaskStore((state) => state.setTask);
  const media = useMediaStore((state) => state.media);
  const unloadMedia = useMediaStore((state) => state.unloadMedia);

  return async function (audiofile: Audiofile) {
    const playlist_key = getPlaylistMediaStoreKey(audiofile.playlist_id);
    const taskId = genTaskId();
    const task: MediaTask = {
      type: TaskType.MediaTask,
      title: "Deleting audio: " + audiofile.filename,
      media: audiofile,
    };

    setTask(taskId, task);
    try {
      await deleteAudioFile(audiofile.id);
      queryClient.invalidateQueries({
        queryKey: playlist_key,
      });
      if (media?.audiofile.id === audiofile.id) {
        unloadMedia();
      }
    } catch (error) {
      throw error;
    } finally {
      removeTask(taskId);
    }
  };
}

export function useDeletePlaylist() {
  const removeTask = useTaskStore((state) => state.removeTask);
  const setTask = useTaskStore((state) => state.setTask);
  const removeMediaList = useMediaListStore((state) => state.removeMediaList);
  const media = useMediaStore((state) => state.media);
  const unloadMedia = useMediaStore((state) => state.unloadMedia);

  return async function (playlist: Playlist) {
    toast(`Deleting playlist "${playlist.name}"`, {
      description: "This may take a while",
    });
    const taskId = genTaskId();
    const task: MediaTask = {
      type: TaskType.MediaTask,
      title: `Deleting playlist "${playlist.name}"`,
      media: playlist,
    };

    setTask(taskId, task);
    try {
      await deletePlaylist(playlist.id);
      toast("Playlist deleted successfully");
      const key = getPlaylistMediaStoreKey(playlist.id);
      removeMediaList(flattenQueryKey(key));

      if (media?.audiofile.playlist_id === playlist.id) {
        unloadMedia();
      }
    } catch (error) {
      toast(`Error deleting playlist "${playlist.name}"`);
      throw error;
    } finally {
      removeTask(taskId);
    }
  };
}
