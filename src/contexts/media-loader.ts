import { getObjectUrl } from "@/api/requests/media";
import Hls, {
  HlsConfig,
  LoaderCallbacks,
  LoaderConfiguration,
  LoaderContext,
} from "hls.js";
import { Audiofile } from "@/api/types/media";
import { MediaUpdateAction } from "./media";

export class CustomLoader extends Hls.DefaultConfig.loader {
  async load(
    context: LoaderContext,
    config: LoaderConfiguration,
    callbacks: LoaderCallbacks<LoaderContext>,
  ): Promise<void> {
    try {
      // Hls allows relative URLs, so hls.js will try to load the fragment files from the
      // same origin as the manifest. This is not what we want, so we need to remove the
      // base from the URL.
      // TODO: this is a workaround, the backend should use absolute URLS
      const url = context.url.slice(context.url.lastIndexOf("/") + 1);
      const signedUrl = await getObjectUrl(url);
      context = { ...context, url: signedUrl };
      super.load(context, config, callbacks);
    } catch (error) {
      // Handle any errors in getting signed URL
      callbacks.onError(
        { code: 500, text: "Error fetching URL" },
        context,
        null,
        super.stats,
      );
    }
  }
}

const HLS_CONFIG: Partial<HlsConfig> = {
  loader: CustomLoader,
  enableWorker: true,
  lowLatencyMode: true,
  backBufferLength: 90,
  // Add specific audio optimization configs
  maxBufferLength: 30,
  maxMaxBufferLength: 60, // Maximum buffer size in seconds
  maxBufferSize: 2 * 1000 * 1000, // 2MB max buffer size
  // Optimize for audio-only streams
  progressive: true,
  manifestLoadingTimeOut: 10000, // 10 seconds timeout for manifest loading
  manifestLoadingMaxRetry: 2, // Retry manifest loading twice
  levelLoadingTimeOut: 10000, // 10 seconds timeout for level loading
  fragLoadingTimeOut: 20000, // 20 seconds timeout for fragment loading
};

interface HlsLoadResult {
  duration: number;
}

export function loadHls(manifest: string, video: HTMLVideoElement) {
  const hls = new Hls(HLS_CONFIG);
  return new Promise<HlsLoadResult>((resolve, reject) => {
    let mediaAttached = false;
    let levelLoaded = false;
    let duration = 0;

    function tryResolve() {
      if (mediaAttached && levelLoaded) {
        resolve({
          duration,
        });
        // remove error listener to avoid shadowing future hls errors
        hls.off(Hls.Events.ERROR);
      }
    }

    hls.once(Hls.Events.MEDIA_ATTACHED, function () {
      mediaAttached = true;
      tryResolve();
    });

    hls.once(Hls.Events.LEVEL_LOADED, function (_, data) {
      levelLoaded = true;
      duration = Math.round(data.details.totalduration);
      tryResolve();
    });

    hls.once(Hls.Events.ERROR, function (_, data) {
      reject(data);
      hls.destroy();
    });

    hls.loadSource(manifest);
    hls.attachMedia(video);
  });
}

export function getNextAudio(
  medialist: Audiofile[],
  audiofile: Audiofile,
  action: MediaUpdateAction,
  curIndex?: number,
): number {
  const pos = medialist.findIndex((val) => val.id === audiofile.id);
  let index: number;
  if (pos === -1) {
    // if song is no longer in the list, use the previous known location of the song in the list
    if (curIndex === undefined) {
      return 0;
    }
    index = curIndex;
  } else {
    // if song is still in the list, use its current location in the list
    index = pos;
  }

  if (action === "next") {
    if (index === medialist.length - 1) {
      return 0;
    } else {
      return (index + 1) % medialist.length;
    }
  } else {
    if (index === 0) {
      return medialist.length - 1;
    } else {
      return (index - 1) % medialist.length;
    }
  }
}
