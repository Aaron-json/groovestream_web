export type Audiofile = {
  id: string;
  filename: string;
  object_id: string;
  title: string | null;
  album: string | null;
  playlist_id: string;
  uploaded_at: string;
  uploaded_by_id: string | null;
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
  audiofile_id: string;
  objects: string[];
  manifest_file: string;
  protocol: "hls" | "dash";
  codec: "aac" | "flac";
  created_at: string;
};

export type Playlist = {
  id: string;
  name: string;
  owner_id: string;
  owner_username: string;
  created_at: string;
};

export type Media = Audiofile | Playlist;

export function isAudiofile(media: Media): media is Audiofile {
  return "filename" in media;
}
