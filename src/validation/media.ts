export function validatePlaylistName(playlistName: string) {
  const playlistNamePattern = /^[\w\s-]{1,30}$/;
  return playlistNamePattern.test(playlistName);
}
