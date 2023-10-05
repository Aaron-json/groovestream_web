// check types with the backend especially for dates

interface user{
    firstName: string;
    lasttName: string;
    email: string;
    dateOfBirth: number;
    audioFiles: AudioFile[];
    playlists: Playlist[];
    friends: User[];
    recentSearches: RecentSearch[];
    dateCreated: number;

}

interface AudioFile{
    _id: string;
    type: 0;
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
    format:Object | NullOrUndefined;
    icon: {
        mimeType: string | NullOrUndefined;
        data: string | NullOrUndefined;
    }

}

interface Playlist{
    _id:string;
    type: 1;
    name: string;
    dateCreated: number;
    audioFiles: AudioFIle[];
    playbackCount: number;
    lastPlayed: number;

}

interface PlaylistAudioFile extends AUdioFile{
    type:2;
    playlistID: string;
}

interface RecentSearch{
    _id: string;
    mediaID: string;
    mediaType: number;
    dateCreated: number;
}