// check types with the backend especially for dates
interface User {
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: string; //date string
  audioFiles?: AudioFile[];
  playlists?: Playlist[];
  friends?: User[];
  recentSearches?: RecentSearch[];
  createdAt?: string;
  profilePicture?: {
    mimeType: string;
    data: string;
    encoding: string;
  };
}
// listed in the order of their indexes
enum MediaTypes {
  AudioFile,
  Playlist,
  PlaylistAudioFile,
  SharedPlaylist,
  SharedPlaylistAudioFile,
}
interface AudioFile {
  _id: string;
  type: number;
  filename: string;
  title: string | NullOrUndefined;
  album: string | NullOrUndefined;
  artists: string[] | NullOrUndefined;
  trackNumber: number | NullOrUndefined;
  duration: number | NullOrUndefined;
  genre: string | NullOrUndefined;
  playbackCount: number;
  lastPlayed: number;
  format: any;
  icon: {
    mimeType: string | NullOrUndefined;
    data: string | NullOrUndefined;
  };
  createdAt: Date;
  updatedAt: Date;
}
interface Playlist {
  _id: string;
  type: number;
  name: string;
  createdAt: number;
  audioFiles: PlaylistAudioFile[];
  playbackCount: number;
  lastPlayed: number;
  updatedAt: number;
}
interface SharedPlaylist extends Playlist {
  audioFiles: SharedPlaylistAudioFile[];
  owner: string;
  members: PlaylistMember[];
}

interface PlaylistAudioFile extends AudioFile {
  // shared playlist audioFile has the same signature
  playlistID: string;
}
interface PlaylistMember {
  memberID: string;
  createdAt: Date;
  updatedAt: Date;
}
interface SharedPlaylistAudioFile extends PlaylistAudioFile {
  uploadedBy: PlaylistMember;
}
interface PlaylistInvite {
  createdAt: Date;
  updatedAt: Date;
  playlistID: {
    _id: string;
    name: string;
  };
  senderID: {
    _id: string;
    email: string;
  };
}
type Playable = AudioFile | PlaylistAudioFile | SharedPlaylistAudioFile;
type Media = Playlist | SharedPlaylist | Playable;

interface RecentSearch {
  _id: string;
  mediaID: string;
  mediaType: number;
  createdAt: number;
}

interface Friend {
  createdAt: Date;
  updatedAt: Date;
  friendID: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface FriendRequest {
  createdAt: Date;
  updatedAt: Date;
  senderID: {
    email: string;
    _id: string;
  };
}
