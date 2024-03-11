import { library_icon, music_icon } from "../../assets/default-icons";
import { sound_waves } from "../../assets/default-icons/MediaBar";
import { AudioFile, Playlist } from "../../types/media";
export const supportedAudioFormats = ["audio/mpeg", "audio/wav", "audio/wave"];
export const supportedProfilePictureFormats = ["image/jpeg", "image/png"];

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
