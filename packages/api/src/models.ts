import type {
  AudiofileView,
  PlaylistView,
} from "./generated/types.gen";

export type {
  AudiofileView as Audiofile,
  Encoding,
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
