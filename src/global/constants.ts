export const supportedProfilePictureFormats = ["image/jpeg", "image/png"];
export const supportedAudioFormats = ["audio/mpeg", "audio/wav"];

export const MAX_AUDIOFILE_UPLOAD_SIZE = 50 * 1024 * 1024;

export const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024;

export const PLAYLISTS_CACHE_KEY = "playlists"

/** Use together with the playlist id */
export const PLAYLIST_AUDIOFILES_CACHE_KEY = "playlist-audiofiles"

/** Use together with the playlist id */
export const PLAYLIST_INFO_CACHE_KEY = "playlist-info"
