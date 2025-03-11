import { useQuery } from "@tanstack/react-query";
import {
  deleteAudioFile,
  deletePlaylist,
  FileUploadResultEvent,
  getAudioFileHistory,
  getMostPlayedAudioFiles,
  getPlaylistAudiofiles,
  uploadAudioFile,
} from "../api/requests/media";
import { useStore } from "../store/store";
import { useId } from "react";
import { MediaTask, TaskType } from "../store/types";
import { Playlist, Audiofile } from "@/api/types/media";
import { toast } from "sonner";

export function usePlaylistAudioFiles(playlistId: number) {
  const key = "playlist-audiofiles" + "-" + playlistId.toString();
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

  return async function (files: FileList, playlist: Playlist) {
    toast("Uploading audio files", {
      description: "This may take a while...",
    });

    // keeps a mapping of the index of the file and its taskId
    // so that we can clear it once it is done
    const taskIdxToId: Record<number, string> = {};
    function onError(e: any) {
      if (e.filename && e.id && e.event) {
        // an upload error event and not any other
        // generic error
        toast("Upload error", {
          description: `Uploading "${e.filename}"`,
        });
        removeTask(taskIdxToId[e.id]);
      } else {
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

    await uploadAudioFile(files, playlist.id, { onError, onSuccess });
  };
}

export function useDeleteAudioFile(key: string, audiofile: Audiofile) {
  const removeTask = useStore((state) => state.removeTask);
  const setTask = useStore((state) => state.setTask);
  const taskId = useId();
  const task: MediaTask = {
    type: TaskType.MediaTask,
    title: "Deleting audio file: " + audiofile.filename,
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
    title: "Deleting playlist",
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
