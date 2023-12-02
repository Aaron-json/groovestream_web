import { library_icon, music_icon } from "../../assets/default-icons";
import { sound_waves } from "../../assets/default-icons/MediaBar";
export const supportedAudioFormats = ["audio/mpeg", "audio/wav", "audio/wave"];
export function getSongIcon(
  song: AudioFile | NullOrUndefined | PlaylistAudioFile
) {
  if (!song) {
    // no media is loaded
    return sound_waves;
  } else if (!song.icon.data) {
    // media is loaded but it has no icon
    return music_icon;
  } else if (song.icon.data) {
    // media is loaded and it has an icon
    return `data:${song.icon.mimeType};base64,${song.icon.data}`;
  }
}

export function getPlaylistIcon(playlist: Playlist) {
  if (playlist?.audioFiles && playlist.audioFiles.length > 0) {
    // playlist is not falsy and has at least one audiofile
    for (let i = 0; i < playlist.audioFiles.length; i++) {
      let currentAudioFile = playlist.audioFiles[i];
      if (currentAudioFile.icon?.data) {
        // first song with icon is the playlist's icon
        return `data:${currentAudioFile.icon.mimeType};base64,${currentAudioFile.icon.data}`;
      }
    }
    // could not find a song with an icon
    return library_icon;
  } else {
    return library_icon;
  }
}
