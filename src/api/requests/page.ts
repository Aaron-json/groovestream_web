import { getUserPlaylists } from "./media";

export async function getLibraryPageData() {
  return getUserPlaylists();
}
