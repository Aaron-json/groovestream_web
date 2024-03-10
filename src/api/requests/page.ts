import { getAllUserMedia } from "./media";

export async function getLibraryPageData() {
  return getAllUserMedia();
}
