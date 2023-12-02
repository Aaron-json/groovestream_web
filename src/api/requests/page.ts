import { getAllUserMedia } from "./media";
import { getUserFields } from "./user";

export async function getHomePageData() {
  const fields = ["firstName", "audioFiles", "playlists"];
  return getUserFields(fields);
}

export async function getLibraryPageData() {
  return getAllUserMedia();
}
