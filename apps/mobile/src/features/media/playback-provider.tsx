import { setAudioModeAsync } from "expo-audio";
import { usePlaybackStore } from "@groovestream/media/playback-store";
import { recordListeningHistory } from "@groovestream/query/media";
import { useEffect, type PropsWithChildren } from "react";
import { useAppToast } from "@/components/app-toast";
import { useAuth } from "@/features/auth/auth-provider";
import { getErrorMessage } from "@/lib/errors";
import { queryClient } from "@/lib/query";
import { nativePlayer } from "./native-player";

export function PlaybackProvider({ children }: PropsWithChildren) {
  const toast = useAppToast();
  const { session } = useAuth();
  const init = usePlaybackStore((state) => state.init);
  const destroy = usePlaybackStore((state) => state.destroy);
  const unloadMedia = usePlaybackStore((state) => state.unloadMedia);

  useEffect(() => {
    void init(nativePlayer, {
      onMediaChange: (media) => {
        void recordListeningHistory(queryClient, media.audiofile.id).catch(
          () => {},
        );
      },
    }).catch((error) => {
      toast.error(
        "Audio unavailable",
        getErrorMessage(error, "The device audio player could not be started"),
      );
    });

    return () => {
      void destroy().catch(() => {});
    };
  }, [destroy, init, toast]);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch((error) => {
      toast.error(
        "Audio unavailable",
        getErrorMessage(error, "The device audio session could not be started"),
      );
    });
  }, [toast]);

  useEffect(() => {
    if (!session) unloadMedia();
  }, [session, unloadMedia]);

  return children;
}
