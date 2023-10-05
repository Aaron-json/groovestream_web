import { library_icon, music_icon } from "../default-icons";
import { sound_waves } from "../default-icons/MediaBar";
export const supportedAUdioFormats = ["audio/mpeg", "audio/wav", "audio/wave"];
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

    if (!playlist || playlist.audioFiles.length === 0) {
        // playlist is null || undefined or playlist has no music
        return library_icon;
    }
    else if (playlist.audioFiles.length > 0 && playlist.audioFiles) {
        //find the first song that has an icon

        for (let i = 0; i < playlist.audioFiles.length; i++) {
            let currentAudioFile = playlist.audioFiles[i]
            if (currentAudioFile.icon.data) {
                return `data:${currentAudioFile.icon.mimeType};base64,${currentAudioFile.icon.data}`
            }
        }
        return library_icon;
    }
}