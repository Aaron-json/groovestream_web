import { useMutation, useQuery } from "@tanstack/react-query";
import {
  deleteAudioFile,
  deletePlaylist,
  getAudioFileHistory,
  getMostPlayedAudioFiles,
  getPlaylistAudiofiles,
  getPlaylistInfo,
  getUserPlaylists,
  leavePlaylist,
  uploadAudiofile,
} from "../api/requests/media";
import { MediaTask, NewMediaTask, TaskType, useTaskStore } from "@/lib/tasks";
import { Playlist, Audiofile } from "@/api/types/media";
import { toast } from "sonner";
import { queryClient } from "@/lib/query";

import { useMediaStateStore } from "@/lib/media/stores/state";
import { isAxiosError } from "axios";
import { ResponseError } from "@/api/types/errors";

export type MediaQueryKey = string[];

// store and cache keys
// These keys are used to access / update data in the
// react-query and client store layers. react-query uses the
// []string type while the store expects a string.

const MOST_PLAYED_KEY: MediaQueryKey = ["most-played"];
const LISTENING_HISTORY_KEY: MediaQueryKey = ["listening-history"];

// Returns a key that corresponds to all of the specific playlist's
// data
export function getPlaylistKey(playlist_id: Playlist["id"]) {
  return ["playlist", playlist_id];
}

// If playlist_id is undefined, the key returned will correspond
// to the media lists for all playlists.
export function getPlaylistAudiofilesKey(
  playlist_id: Playlist["id"],
): MediaQueryKey {
  return ["playlist", playlist_id, "audiofiles"];
}

// If playlist_id is undefined, the key returned will correspond
// to the metadata for all playlists.
export function getPlaylistMetadataKey(
  playlist_id: Playlist["id"],
): MediaQueryKey {
  return ["playlist", playlist_id, "metadata"];
}

// The key for the list of playlists
export function getPlaylistsListKey(): MediaQueryKey {
  return ["playlists", "list"];
}

export function usePlaylistList() {
  const queryKey = getPlaylistsListKey();
  const query = useQuery({
    queryKey,
    queryFn: () => getUserPlaylists(),
  });

  return { ...query, queryKey } as const;
}

export function usePlaylistInfo(playlistId: Playlist["id"]) {
  const queryKey = getPlaylistMetadataKey(playlistId);
  const query = useQuery({
    queryKey,
    queryFn: async () => getPlaylistInfo(playlistId),
  });
  return { ...query, queryKey } as const;
}

export function usePlaylistAudiofiles(playlistId: Playlist["id"]) {
  const queryKey = getPlaylistAudiofilesKey(playlistId);
  const query = useQuery({
    queryKey,
    queryFn: () => getPlaylistAudiofiles(playlistId),
  });
  return { ...query, queryKey } as const;
}

export function useMostPlayed(limit = 10) {
  const queryKey = MOST_PLAYED_KEY;
  const query = useQuery({
    queryKey,
    queryFn: () => getMostPlayedAudioFiles(limit),
  });
  return { ...query, queryKey } as const;
}

export function useListeningHistory(limit = 10, skip?: number) {
  const queryKey = LISTENING_HISTORY_KEY;
  const query = useQuery({
    queryKey,
    queryFn: () => getAudioFileHistory(limit, skip),
  });
  return { ...query, queryKey } as const;
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
        queryClient.invalidateQueries({
          queryKey: ["cloud-tasks"],
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

export function useDeleteAudiofile() {
  const removeTask = useTaskStore((state) => state.removeTask);
  const setTask = useTaskStore((state) => state.setTask);
  const media = useMediaStateStore((state) => state.media);
  const unloadMedia = useMediaStateStore((state) => state.unloadMedia);

  return useMutation({
    mutationFn: (audiofile: Audiofile) => deleteAudioFile(audiofile.id),
    onMutate: async (audiofile) => {
      const taskId = genTaskId();
      const task: MediaTask = {
        type: TaskType.MediaTask,
        title: "Deleting audio: " + audiofile.filename,
        media: audiofile,
      };
      setTask(taskId, task);

      return { taskId };
    },
    onSuccess: (_data, audiofile) => {
      const key = getPlaylistAudiofilesKey(audiofile.playlist_id);
      toast.success("Audio file deleted successfully");

      if (media?.audiofile.id === audiofile.id) {
        unloadMedia();
      }
      queryClient.invalidateQueries({
        queryKey: key,
      });
    },
    onError: (_, audiofile) => {
      toast.error(`Error deleting audio file "${audiofile.filename}"`);
    },
    onSettled: (_data, _error, _audiofile, context) => {
      if (context?.taskId) {
        removeTask(context.taskId);
      }
    },
  });
}

// Hook used to delete a playlsit. It integerates with the task store
export function useDeletePlaylist() {
  const removeTask = useTaskStore((state) => state.removeTask);
  const setTask = useTaskStore((state) => state.setTask);
  const media = useMediaStateStore((state) => state.media);
  const unloadMedia = useMediaStateStore((state) => state.unloadMedia);

  return useMutation({
    mutationFn: (playlist: Playlist) => deletePlaylist(playlist.id),
    onMutate: async (playlist) => {
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

      return { taskId };
    },
    onSuccess: (_data, playlist) => {
      toast.success("Playlist deleted successfully");

      if (media?.audiofile.playlist_id === playlist.id) {
        unloadMedia();
      }

      // ivalidate caches that are affected by this operation
      queryClient.invalidateQueries({ queryKey: getPlaylistKey(playlist.id) });
      queryClient.invalidateQueries({ queryKey: getPlaylistsListKey() });
    },
    onError: (_, playlist) => {
      toast.error(`Error deleting playlist "${playlist.name}"`);
    },
    onSettled: (_data, _error, _playlist, context) => {
      if (context?.taskId) {
        removeTask(context.taskId);
      }
    },
  });
}

export function useLeavePlaylist() {
  const media = useMediaStateStore((state) => state.media);
  const unloadMedia = useMediaStateStore((state) => state.unloadMedia);

  return useMutation({
    mutationFn: (playlist: Playlist) => leavePlaylist(playlist.id),
    onSuccess: (_data, playlist) => {
      toast.success(`Successfully left the playlist "${playlist.name}"`);

      if (media?.audiofile.playlist_id === playlist.id) {
        unloadMedia();
      }

      // ivalidate caches that are affected by this operation
      queryClient.invalidateQueries({ queryKey: getPlaylistKey(playlist.id) });
      queryClient.invalidateQueries({ queryKey: getPlaylistsListKey() });
    },
    onError: (error, playlist) => {
      let message = "Could not leave the playlist. Please try again.";
      if (isAxiosError<ResponseError>(error)) {
        const errorCode = error.response?.data.error_code;
        if (errorCode === "OWNER_CANNOT_LEAVE") {
          message = "The owner of a playlist cannot leave it.";
        }
      }
      toast.error(`Error leaving playlist "${playlist.name}"`, {
        description: message,
      });
    },
  });
}
