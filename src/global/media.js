import { music_icon } from "../default-icons";
import { sound_waves } from "../default-icons/MediaBar";

export function mediaIcon(media) {
    if (!media) {
        // no media is loaded
        return sound_waves;
    } else if (!media.icon.data) {
        // media is loaded but it has no icon
        return music_icon;
    } else if (media.icon.data) {
        // media is loaded and it has an icon
        return `data:${media.icon.mimeType};base64,${media.icon.data}`;
    }
}