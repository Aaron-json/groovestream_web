export type Audiofile = {
  id: number;
  filename: string;
  object_id: string;
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
  channels: number | null;
};

export type AudiofileDeliverable = {
  id: string;
  audiofile_id: number;
  objects: string[];
  manifest_file: string;
  protocol: "hls" | "dash";
  codec: "aac" | "flac";
  created_at: string;
};

export type Playlist = {
  id: number;
  name: string;
  owner_id: number;
  owner_username: string;
  created_at: string;
};

export type Media = Audiofile | Playlist;

export function isAudiofile(media: Media): media is Audiofile {
  return "filename" in media;
}
