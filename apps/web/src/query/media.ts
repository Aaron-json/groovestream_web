import {
  deleteAudiofile,
  deletePlaylist,
  leavePlaylist,
  listTasks,
} from "@groovestream/api/sdk";
import type {
  Audiofile,
  Playlist,
  PlaylistInvite,
} from "@groovestream/api/models";
import {
  addPlaylistToCache as addPlaylistToSharedCache,
  createListeningHistoryAudiofileSource as createSharedHistorySource,
  createMostPlayedAudiofileSource as createSharedMostPlayedSource,
  createPlaylistAudiofileSource as createSharedPlaylistSource,
  removeAudiofileFromCache as removeAudiofileFromSharedCache,
  removePlaylistFromCache as removePlaylistFromSharedCache,
  removePlaylistInviteFromCache as removeInviteFromSharedCache,
} from "@groovestream/query/media";
import { useMutation, queryOptions } from "@tanstack/react-query";
import { uploadAudiofile } from "@/api/upload";
import { MediaTask, NewMediaTask, TaskType, useTaskStore } from "@/lib/tasks";
import { queryClient } from "@/lib/query";

export function createPlaylistAudiofileSource(playlistId: Playlist["id"]) {
  return createSharedPlaylistSource(queryClient, playlistId);
}

export function createMostPlayedAudiofileSource() {
  return createSharedMostPlayedSource(queryClient);
}

export function createListeningHistoryAudiofileSource() {
  return createSharedHistorySource(queryClient);
}

export function addPlaylistToCache(playlist: Playlist) {
  addPlaylistToSharedCache(queryClient, playlist);
}

export function removePlaylistInviteFromCache(invite: PlaylistInvite) {
  removeInviteFromSharedCache(queryClient, invite);
}

export function cloudTasksOptions() {
  return queryOptions({
    queryKey: ["cloud-tasks"],
    queryFn: ({ signal }) => listTasks({ signal }),
  });
}

function genTaskId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function useUploadAudioFile() {
  const setTask = useTaskStore((state) => state.setTask);
  const removeTask = useTaskStore((state) => state.removeTask);

  return async function (files: File[], playlist: Playlist) {
    const failures: Array<{ file: File; error: unknown }> = [];

    for (const file of files) {
      let taskId: string | undefined;
      try {
        taskId = genTaskId();
        const task = NewMediaTask(`Uploading "${file.name}"`);
        setTask(taskId, task);
        await uploadAudiofile(file, playlist.id, {
          onProgress: (current, total) => {
            setTask(taskId!, {
              ...task,
              progress: { current, total, unit: "bytes" },
            });
          },
        });
        void queryClient.invalidateQueries({
          queryKey: cloudTasksOptions().queryKey,
        });
      } catch (error) {
        failures.push({ file, error });
      } finally {
        if (taskId) removeTask(taskId);
      }
    }

    return { failures };
  };
}

export function useDeleteAudiofile() {
  const removeTask = useTaskStore((state) => state.removeTask);
  const setTask = useTaskStore((state) => state.setTask);

  return useMutation({
    mutationFn: (audiofile: Audiofile) =>
      deleteAudiofile({ path: { audiofile_id: audiofile.id } }),
    onMutate: async (audiofile) => {
      const taskId = genTaskId();
      const task: MediaTask = {
        type: TaskType.MediaTask,
        title: `Deleting audio: ${audiofile.filename}`,
        media: audiofile,
      };
      setTask(taskId, task);
      return { taskId };
    },
    onSuccess: (_data, audiofile) => {
      removeAudiofileFromSharedCache(queryClient, audiofile);
    },
    onSettled: (_data, _error, _audiofile, context) => {
      if (context?.taskId) removeTask(context.taskId);
    },
  });
}

export function useDeletePlaylist() {
  const removeTask = useTaskStore((state) => state.removeTask);
  const setTask = useTaskStore((state) => state.setTask);

  return useMutation({
    mutationFn: (playlist: Playlist) =>
      deletePlaylist({ path: { playlist_id: playlist.id } }),
    onMutate: async (playlist) => {
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
      removePlaylistFromSharedCache(queryClient, playlist.id);
    },
    onSettled: (_data, _error, _playlist, context) => {
      if (context?.taskId) removeTask(context.taskId);
    },
  });
}

export function useLeavePlaylist() {
  return useMutation({
    mutationFn: (playlist: Playlist) =>
      leavePlaylist({ path: { playlist_id: playlist.id } }),
    onSuccess: (_data, playlist) => {
      removePlaylistFromSharedCache(queryClient, playlist.id);
    },
  });
}
