import { components } from "./schema";

export type Audiofile = components["schemas"]["AudiofileView"];
export type Playlist = components["schemas"]["PlaylistView"];
export type AudioDeliverable = components["schemas"]["GetDeliverablesRow"];

export type Media = Audiofile | Playlist;

export function isAudiofile(media: Media): media is Audiofile {
  return "filename" in media;
}
