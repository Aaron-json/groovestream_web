import { library_icon, music_icon } from "../assets/default-icons";
import { sound_waves } from "../assets/default-icons/MediaBar";
import { MediaUpdaterFunc } from "../contexts/types";
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
export function getNextAudio(medialist: (AudioFile | Playlist)[], audiofile: AudioFile, curIndex: number, action: "next" | "prev"): number {
  /*
   * Hey bro, I am an audiofile*/
  if (!medialist) {
    return -1;
  }
  const pos = medialist.findIndex((val) => val.id === audiofile.id)
  let index: number;
  if (pos === -1) {
    // if song is no longer in the list, use the previous known location of the song in the list
    index = curIndex
  } else {
    // if song is still in the list, use its current location in the list
    index = pos
  }
  function _getnextIdx() {
    if (action === "next") {
      return (index + 1) % medialist.length;
    } else {
      return (index - 1) % medialist.length;
    }
  }
  let nextIndex: number;
  do {
    nextIndex = _getnextIdx();
  } while (medialist[nextIndex].type !== MediaType.AudioFile)

  return nextIndex
}
