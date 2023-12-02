import { Howl, Howler } from "howler";
export default class MediaPlayer {
  #HowlInstance: Howl | undefined;
  currentSourceID: string | undefined;
  #DefaultConfiguration = {
    html5: false,
    volume: 1,
    loop: false,
  };
  // #GlobalHowler = Howler.init()

  async #loadSourceHelper(source: MediaSourceConfig) {
    return new Promise((resolve, reject) => {
      this.#HowlInstance = new Howl({
        ...this.#DefaultConfiguration,
        src: [source.data],
        // format: source.format,
        onload: resolve,
        onloaderror: reject,
      });
    });
  }

  async loadSource(source: MediaSourceConfig) {
    if (!this.#HowlInstance) {
      // new Howl created
      await this.#loadSourceHelper(source);
      console.log("other side");

      this.currentSourceID = source._id;
    } else {
      // A different song is selected
      this.unloadSource();
      await this.#loadSourceHelper(source);
      this.currentSourceID = source._id;
    }
  }

  unloadSource() {
    if (!this.#HowlInstance) {
      return;
    }

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
  isLoaded() {
    return this.#HowlInstance !== undefined;
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

interface MediaSourceConfig {
  data: string;
  _id: string;
  format: string;
}
