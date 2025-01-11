import { useQuery } from "@tanstack/react-query";
import {
  deleteAudioFile,
  deletePlaylist,
  getAudioFileHistory,
  getMostPlayedAudioFiles,
  getPlaylistAudiofiles,
  uploadAudioFile,
} from "../api/requests/media";
import { useStore } from "../store/store";
import { useId } from "react";
import { MediaTask, TaskType } from "../store/types";
import { AxiosProgressEvent } from "axios";
import { Playlist, Audiofile } from "../types/media";

export function usePlaylistAudioFiles(playlistId: number) {
  const PLAYLIST_AUDIOFILES_KEY = "playlist-audiofiles";
  const setMediaList = useStore((state) => state.setMediaList);
  const query = useQuery({
    queryKey: [PLAYLIST_AUDIOFILES_KEY, playlistId],
    queryFn: async () => {
      const data = await getPlaylistAudiofiles(playlistId);
      setMediaList(PLAYLIST_AUDIOFILES_KEY + "-" + playlistId, data);
      return data;
    },
  });
  return { ...query, key: PLAYLIST_AUDIOFILES_KEY } as const;
}

export function useMostPlayed(limit = 10) {
  const MOST_PLAYED_STORE_KEY = "most-played";
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
  const LISTENING_HISTORY_STORE_KEY = "listening-history";
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

export function useUploadAudioFile(files: FileList, playlist: Playlist) {
  const setTask = useStore((state) => state.setTask);
  const removeTask = useStore((state) => state.removeTask);
  const taskId = useId();
  const message = `Uploading audio files`;
  const task: MediaTask = {
    type: TaskType.MediaTask,
    name: message,
    progress: 0,
    media: playlist,
  };

  try {
    setTask(taskId, task);
    return uploadAudioFile(
      files,
      playlist.id,
      (progress: AxiosProgressEvent) => {
        setTask(taskId, { ...task, progress: progress.progress });
      },
    );
  } catch (error) {
    throw error;
  } finally {
    removeTask(taskId);
  }
}

export function useDeleteAudioFile(key: string, audiofile: Audiofile) {
  const removeTask = useStore((state) => state.removeTask);
  const setTask = useStore((state) => state.setTask);
  const taskId = useId();
  const task: MediaTask = {
    type: TaskType.MediaTask,
    name: "Deleting audio file: " + audiofile.filename,
    progress: 0,
    media: audiofile,
  };

  const query = useQuery({
    queryKey: [key],
    queryFn: async () => {
      try {
        setTask(taskId, task);
        return deleteAudioFile(audiofile.id);
      } catch (error) {
        throw error;
      } finally {
        removeTask(taskId);
      }
    },
  });
  return query;
}

export function useDeletePlaylist(key: string, playlist: Playlist) {
  const removeTask = useStore((state) => state.removeTask);
  const setTask = useStore((state) => state.setTask);
  const taskId = useId();
  const task: MediaTask = {
    type: TaskType.MediaTask,
    name: "Deleting playlist",
    progress: 0,
    media: playlist,
  };
  const query = useQuery({
    queryKey: [key],
    queryFn: async () => {
      try {
        setTask(taskId, task);
        return deletePlaylist(playlist.id);
      } catch (error) {
        throw error;
      } finally {
        removeTask(taskId);
      }
    },
  });
  return query;
}
