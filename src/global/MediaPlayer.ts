import { Howl, Howler } from "howler";
export default class MediaPlayer {
  #HowlInstance = null;
  currentSourceID = null;
  #DefaultConfiguration = {
    html5: true,
    volume: 1,
    loop: false,
  };
  // #GlobalHowler = Howler.init()

  #loadSourceHelper(source) {
    return new Promise((resolve, reject) => {
      this.#HowlInstance = new Howl({
        ...this.#DefaultConfiguration,
        src: [source.data],
      })
        .once("load", () => {
          resolve();
        })
        .once("loaderror", () => {
          reject();
        });
    });
  }

  async loadSource(source) {
    if (!this.#HowlInstance) {
      // now Howl created
      await this.#loadSourceHelper(source);
      this.currentSourceID = source._id;
    } else if (source._id === this.currentSourceID) {
      // if same song is selected just reset seeker to the start
      this.#HowlInstance.seek(0);
    } else {
      // A different song is selected
      this.#HowlInstance.unload();
      await this.#loadSourceHelper(source);
      this.currentSourceID = source._id;
    }
  }

  unloadSource() {
    if (!this.#HowlInstance) {
      return;
    }
    this.#HowlInstance.unload();
    this.#HowlInstance = null;
    this.currentSourceID = null;
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

  mute(ifMute) {
    Howler.mute(ifMute);
  }
  setVolume(volume) {
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

  setSeek(seekPosition) {
    if (!this.#HowlInstance) {
      return;
    }
    this.#HowlInstance.seek(seekPosition);
  }
  getSeek() {
    if (!this.#HowlInstance) {
      return null;
    }
    return this.#HowlInstance.seek();
  }
  getState() {
    if (!this.#HowlInstance) {
      return undefined;
    } else if (this.#HowlInstance.playing()) {
      return "playing";
    } else {
      return this.#HowlInstance.state(); //"loaded", "unloaded", "loading"
    }
  }
}
