export interface Audiofile {
  id: number;
  filename: string;
  object_id: string;
  objects: string[];
  title: string | null;
  album: string | null;
  playlist_id: number;
  uploaded_at: string;
  uploaded_by_id: number | null;
  uploaded_by_username: string | null;
  artists: string[] | null;
  duration: number | null;
  track_number: number | null;
  track_total: number | null;
  genre: string | null;
  bitrate: number | null;
  mime_type: string;
  format: string;
  channels: number | null;
  sample_rate: number | null;
}

export interface Playlist {
  id: number;
  name: string;
  owner_id: number;
  owner_username: string;
  created_at: string;
}

export type Media = Audiofile | Playlist;

export function isAudiofile(media: Media): media is Audiofile {
  return "filename" in media;
}
