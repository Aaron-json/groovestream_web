export interface PlaylistInvite {
  id: number;
  from_id: number;
  from_username: string;
  to_id: number;
  playlist_id: number;
  playlist_name: string;
  playlist_owner_id: number;
  playlist_owner_username: string;
  created_at: string;
}

export interface FriendRequest {
  id: number;
  from_id: number;
  from_username: string;
  to_id: number;
  created_at: string;
}
