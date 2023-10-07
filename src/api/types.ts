// check types with the backend especially for dates
interface User{
    firstName?: string;
    lastName?: string;
    email?: string;
    dateOfBirth?: number;
    audioFiles?: AudioFile[];
    playlists?: Playlist[];
    friends?: User[];
    recentSearches?: RecentSearch[];
    dateCreated?: number;
    profilePicture?: {
        mimeType: string,
        data: string,
    }

}
enum MediaTypes{
    "AudioFile", "Playlist", "PlaylistAudioFile"
}
interface AudioFile{
    _id: string;
    type: MediaTypes.AudioFile;
    filename: string;
    title: string | NullOrUndefined;
    album: string | NullOrUndefined;
    artists: string[] | NullOrUndefined;
    trackNumber: number | NullOrUndefined;
    duration: number;
    genre: string | NullOrUndefined;
    dateUploaded: number;
    playbackCount: number;
    lastPlayed: number;
    format: any;
    icon: {
        mimeType: string | NullOrUndefined;
        data: string | NullOrUndefined;
    }

}

interface Playlist{
    _id:string;
    type: MediaTypes.Playlist;
    name: string;
    dateCreated: number;
    audioFiles: AudioFile[];
    playbackCount: number;
    lastPlayed: number;

}

interface PlaylistAudioFile extends Omit<AudioFile, 'type'>{
    type: MediaTypes.PlaylistAudioFile;
    playlistID: string;
}

interface RecentSearch{
    _id: string;
    mediaID: string;
    mediaType: number;
    dateCreated: number;
}