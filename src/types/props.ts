import { AudioFile, Playlist } from "./media"
export interface MediaComponentProps {
    items: (AudioFile | Playlist)[]
    title?: string
    mediaStoreKey?: string
}

export interface AudioFileComponentProps extends Pick<MediaComponentProps, "mediaStoreKey"> {
    index: number
    audiofile: AudioFile
    onClick?: () => any
}
export interface PlaylistComponentProps {
    playlist: Playlist
}
