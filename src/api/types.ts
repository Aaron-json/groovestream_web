import type {
  ApiError,
  AudiofileView,
  PlaylistView,
} from "./generated/types.gen";

export type {
  ApiError,
  AudiofileView as Audiofile,
  GetListeningHistoryInfoRow as HistoryMutationItem,
  GetListeningHistoryRow as HistoryItem,
  GetUserTasksRow as CloudTask,
  PaginationAudiofileView as AudiofilePage,
  PaginationGetListeningHistoryRow as HistoryPage,
  PaginationPlaylistInviteView as PlaylistInvitePage,
  PaginationPlaylistView as PlaylistPage,
  PlaylistInviteView as PlaylistInvite,
  PlaylistMemberView as PlaylistMember,
  PlaylistView as Playlist,
  User,
} from "./generated/types.gen";

export type Media = AudiofileView | PlaylistView;

export function isApiError(error: unknown): error is ApiError {
  if (typeof error !== "object" || error === null) return false;

  const candidate = error as Partial<ApiError>;
  return (
    typeof candidate.http_code === "number" &&
    typeof candidate.message === "string" &&
    (candidate.error_code === null ||
      typeof candidate.error_code === "string") &&
    "data" in candidate
  );
}
