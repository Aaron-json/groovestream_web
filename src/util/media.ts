import { library_icon, music_icon } from "../assets/default-icons";
import { sound_waves } from "../assets/default-icons/MediaBar";
import { MediaUpdater } from "../contexts/types";
import { AudioFile, Playlist } from "../types/media";
import { MediaType } from "../types/media";
export function getSongIcon(
  song: AudioFile | undefined
) {
  if (!song) {
    // no media is loaded
    return sound_waves;
  } else if (!song.icon?.data) {
    // media is loaded but it has no icon
    return music_icon;
  } else if (song.icon.data) {
    // media is loaded and it has an icon
    return `data:${song.icon.mimeType};base64,${song.icon.data}`;
  }
}

export function getPlaylistIcon(playlist: Playlist) {
  return library_icon
}

/**
Finds the following audiofile from the given media list.
The implementation has the following behavior:
Cycles back to the start of the list when at the end.
If the next song is the same as the old song, undefined is returned.
if the current audiofile does not exist on the song, the first audiofile will be played.
Playlists are ignored.
*/
export function getNextAudio(media: (AudioFile | Playlist)[], currentID: number, action: "next" | "prev"): AudioFile | undefined {
  console.log("getting next audio")
  /*
   * Hey bro, I am an audiofile*/
  if (!media) {
    console.log("media is undefined")
    return undefined;
  }
  // find current media's index in the list
  const index = media.findIndex((m) => m.id === currentID);
  if (index === -1) {
    // current audiofile does not exist in the list
    return undefined
  }
  function _getnextIdx() {
    if (action === "next") {
      return (index + 1) % media.length;
    } else {
      return (index - 1) % media.length;
    }
  }
  let nextIndex = _getnextIdx();

  while (media[nextIndex].type !== MediaType.AudioFile) {
    // loop to the next audioFile i.e type = 0
    // there will be at least 1 audioFile since only audioFiles clicks
    // can set the currentMedia
    nextIndex = _getnextIdx();
  }
  if (nextIndex === index) {
    // could not find another audiofile
    return undefined
  }

  // type asserion is fine since we know it's an audiofile
  return media[nextIndex] as AudioFile
}
