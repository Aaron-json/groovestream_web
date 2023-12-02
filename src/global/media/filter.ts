function filterMedia(
  mediaList: (Playlist | AudioFile | PlaylistAudioFile)[],
  searchFilter?: string
) {
  if (searchFilter === "" || searchFilter === " " || !searchFilter)
    return mediaList;
  searchFilter = searchFilter.toLowerCase();
  return mediaList.filter((mediaItem) => {
    // check if mediaItem's name, album or artists match the search filter
    if (mediaItem.type === 0) {
      if (
        (mediaItem as AudioFile).filename.toLowerCase().includes(searchFilter)
      )
        return true;
      if (
        (mediaItem as AudioFile).artists &&
        (mediaItem as AudioFile).artists
          .join(" ")
          .toLowerCase()
          .includes(searchFilter)
      )
        return true;
      if (
        (mediaItem as AudioFile).album &&
        (mediaItem as AudioFile).album.toLowerCase().includes(searchFilter)
      )
        return true;

      return false;
    } else if (mediaItem.type === 1) {
      return (mediaItem as Playlist).name.toLowerCase().includes(searchFilter);
    } else {
      return false;
    }
  });
}
