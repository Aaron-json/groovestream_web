export interface Friend {
  friend_username: string;
  created_at: string;
  friendship_id: number;
  friend_id: number;
}

export interface PlaylistMember {
  username: string;
  created_at: string;
  user_id: number;
  id: number;
  playlist_id: number
}
