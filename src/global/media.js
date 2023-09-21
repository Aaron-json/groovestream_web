import { library_icon, music_icon } from "../default-icons";
import { sound_waves } from "../default-icons/MediaBar";

export function getSongIcon(song) {
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

export function getPlaylistIcon(playlist) {
    if (playlist.audioFiles.length === 0) {
        return library_icon;
    }
    else {
        return `data:${playlist.audioFiles[0].icon.mimeType};base64,${playlist.audioFiles[0].icon.data}`
    }
}