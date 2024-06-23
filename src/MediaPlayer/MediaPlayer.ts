import { Howl, Howler } from "howler";
import { streamAudioFile } from "../api/requests/media";
import { BlobToDataUrl } from "./encoding";
export default class MediaPlayer {
  #HowlInstance: Howl | undefined;
  currentSourceID: string | undefined;
  #DefaultConfiguration = {
    html5: false,
    loop: false,
  };
  // #GlobalHowler = Howler.init()

  async #loadSourceHelper(source: SourceConfig) {
    return new Promise(async (resolve, reject) => {
      let audioStr: string;
      try {

        const buf = await streamAudioFile(source.id, "arraybuffer") as ArrayBuffer
        const dataBlob = new Blob([buf], { "type": source.format })
        audioStr = await BlobToDataUrl(dataBlob)

        this.#HowlInstance = new Howl({
          onend: source.onSongEnd,
          onload: resolve,
          onloaderror: reject,
          onplayerror: reject,

          ...this.#DefaultConfiguration,
          src: [audioStr],

        });
      } catch (error) {
        reject(error)
      }
    });
  }

  async loadSource(source: SourceConfig) {
    if (!this.#HowlInstance) {
      // new Howl created
      await this.#loadSourceHelper(source);
      this.currentSourceID = source.id;
    } else {
      // A different song is selected
      this.unloadSource();
      await this.#loadSourceHelper(source);
      this.currentSourceID = source.id;
    }
  }

  unloadSource() {
    Howler.unload();
    this.#HowlInstance = undefined;
    this.currentSourceID = undefined;
  }

  play() {
    if (!this.#HowlInstance || this.#HowlInstance.playing()) {
      return;
    }
    this.#HowlInstance.play();
  }
  pause() {
    if (!this.#HowlInstance) {
      return;
    }
    this.#HowlInstance.pause();
  }

  stop() {
    if (!this.#HowlInstance) {
      return;
    }
    this.#HowlInstance.stop();
  }

  mute(ifMute: boolean) {
    Howler.mute(ifMute);
  }
  setVolume(volume: number) {
    Howler.volume(volume);
  }
  getVolume() {
    return Howler.volume();
  }

  getDuration() {
    if (!this.#HowlInstance) {
      return null;
    }
    return this.#HowlInstance.duration();
  }

  setSeek(seekPosition: number) {
    if (!this.#HowlInstance) {
      return;
    }
    this.#HowlInstance.seek(seekPosition);
  }
  getSeek() {
    if (!this.#HowlInstance) {
      return 0;
    }
    return this.#HowlInstance.seek();
  }

  isPlaying() {
    if (!this.#HowlInstance) return false;
    return this.#HowlInstance.playing();
  }
  getState() {
    if (!this.#HowlInstance) {
      return "unloaded";
    } else if (this.#HowlInstance.playing()) {
      return "playing";
    } else {
      return this.#HowlInstance.state(); //"loaded", "unloaded", "loading"
    }
  }
}

interface SourceConfig {
  id: string;
  format: string;
  onSongEnd: () => any;
}

export type MediaPlaybackState =
  | "unloaded"
  | "playing"
  | "loading"
  | "playing"
  | "stopped"
  | "paused";

