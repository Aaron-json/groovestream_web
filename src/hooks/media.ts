import { useMutation, queryOptions } from "@tanstack/react-query";
import {
  deleteAudioFile,
  deletePlaylist,
  getAudioFileHistory,
  getMostPlayedAudioFiles,
  getPlaylistAudiofiles,
  getPlaylistInfo,
  getPlaylistInvites,
  getCloudTasks,
  getUserPlaylists,
  leavePlaylist,
  uploadAudiofile,
  Playlist,
  Audiofile,
  LeavePlaylistError,
} from "../api/requests/media";
import { MediaTask, NewMediaTask, TaskType, useTaskStore } from "@/lib/tasks";
import { toast } from "sonner";
import { queryClient } from "@/lib/query";

import { useMediaStateStore } from "@/lib/media/stores/state";
import { isAxiosError } from "axios";

export type MediaQueryKey = string[];

// store and cache keys
// These keys are used to access / update data in the
// react-query and client store layers. react-query uses the
// []string type while the store expects a string.

export const MOST_PLAYED_KEY: MediaQueryKey = ["most-played"];
export const LISTENING_HISTORY_KEY: MediaQueryKey = ["listening-history"];

// Returns a key that corresponds to all of the specific playlist's
// data. Used for fuzzy cache invalidation.
export function getPlaylistKey(playlist_id: Playlist["id"]): MediaQueryKey {
  return ["playlist", playlist_id];
}

export function playlistAudiofilesOptions(playlist_id: Playlist["id"]) {
  return queryOptions({
    queryKey: ["playlist", playlist_id, "audiofiles"],
    queryFn: () => getPlaylistAudiofiles({ playlist_id }),
  });
}

export function playlistInfoOptions(playlist_id: Playlist["id"]) {
  return queryOptions({
    queryKey: ["playlist", playlist_id, "metadata"],
    queryFn: () => getPlaylistInfo({ playlist_id }),
  });
}

export function playlistsListOptions() {
  return queryOptions({
    queryKey: ["playlists", "list"],
    queryFn: () => getUserPlaylists(),
  });
}

export function mostPlayedOptions(limit = 10) {
  return queryOptions({
    queryKey: MOST_PLAYED_KEY,
    queryFn: () => getMostPlayedAudioFiles({ limit }),
  });
}

export function listeningHistoryOptions(limit = 10, skip?: number) {
  return queryOptions({
    queryKey: LISTENING_HISTORY_KEY,
    queryFn: () => getAudioFileHistory({ limit, skip }),
  });
}

export function cloudTasksOptions() {
  return queryOptions({
    queryKey: ["cloud-tasks"],
    queryFn: getCloudTasks,
  });
}

export function playlistInvitesOptions(limit = 10) {
  return queryOptions({
    queryKey: ["playlistInvites", limit],
    queryFn: () => getPlaylistInvites({ limit }),
  });
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
          queryKey: cloudTasksOptions().queryKey,
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

// When media lists change, some top resources like "most-played" and
// "listening-history" need to be invalidated too even if we do not know
// for a fact that the invalidation affects that resource
export function mediaListInvalidationSideEffect() {
  queryClient.invalidateQueries({
    queryKey: MOST_PLAYED_KEY,
  });
  queryClient.invalidateQueries({
    queryKey: LISTENING_HISTORY_KEY,
  });
}

export function useDeleteAudiofile() {
  const removeTask = useTaskStore((state) => state.removeTask);
  const setTask = useTaskStore((state) => state.setTask);
  const media = useMediaStateStore((state) => state.media);
  const unloadMedia = useMediaStateStore((state) => state.unloadMedia);

  return useMutation({
    mutationFn: (audiofile: Audiofile) =>
      deleteAudioFile({ audiofile_id: audiofile.id }),
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
      const key = playlistAudiofilesOptions(audiofile.playlist_id).queryKey;
      toast.success("Audio file deleted successfully");

      if (media?.audiofile.id === audiofile.id) {
        unloadMedia();
      }

      queryClient.invalidateQueries({
        queryKey: key,
      });
      mediaListInvalidationSideEffect();
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
    mutationFn: (playlist: Playlist) =>
      deletePlaylist({ playlist_id: playlist.id }),
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
      queryClient.invalidateQueries({
        queryKey: playlistsListOptions().queryKey,
      });
      mediaListInvalidationSideEffect();
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
    mutationFn: (playlist: Playlist) =>
      leavePlaylist({ playlist_id: playlist.id }),
    onSuccess: (_data, playlist) => {
      toast.success(`Successfully left the playlist "${playlist.name}"`);

      if (media?.audiofile.playlist_id === playlist.id) {
        unloadMedia();
      }

      // ivalidate caches that are affected by this operation
      queryClient.invalidateQueries({ queryKey: getPlaylistKey(playlist.id) });
      queryClient.invalidateQueries({
        queryKey: playlistsListOptions().queryKey,
      });
      mediaListInvalidationSideEffect();
    },
    onError: (error, playlist) => {
      let message = "Could not leave the playlist. Please try again.";
      if (isAxiosError<LeavePlaylistError>(error)) {
        const errorCode = error.response?.data.error_code;
        if (errorCode === "OWNER_CANNOT_LEAVE") {
          message = "The owner of a playlist cannot leave it.";
        } else {
          message = error.response?.data.message || message;
        }
      }
      toast.error(`Error leaving playlist "${playlist.name}"`, {
        description: message,
      });
    },
  });
}
