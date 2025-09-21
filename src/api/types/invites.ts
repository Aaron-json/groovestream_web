export interface PlaylistInvite {
  id: string;
  from_id: string;
  from_username: string;
  to_id: string;
  playlist_id: string;
  playlist_name: string;
  playlist_owner_id: string;
  playlist_owner_username: string;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  from_id: string;
  from_username: string;
  to_id: string;
  created_at: string;
}
