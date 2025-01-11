import { Audiofile, Playlist } from "./media"
export interface MediaComponentProps {
  items: (Audiofile | Playlist)[]
  title?: string
  mediaStoreKey?: string
}

export interface AudioFileComponentProps extends Pick<MediaComponentProps, "mediaStoreKey"> {
  index: number
  audiofile: Audiofile
  onClick?: () => any
}
export interface PlaylistComponentProps {
  playlist: Playlist
}
