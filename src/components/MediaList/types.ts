export const MediaTypesConversion = {
  All: [0, 1, 2],
  Songs: [0, 2],
  Playlists: [1],
};
const sortByOptions = { Name: "name", "Date Created": "dateCreated" };
const orderOptions = { "A-Z": "ascending", "Z-A": "descending" };

export interface MediaFilters {
  mediaTypes: string; // corresponds to key of MediaTypesConversion
  sortBy: string;
  sort: string;
}
