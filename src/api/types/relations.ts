import { components } from "./schema";

export interface Friend {
  friend_username: string;
  created_at: string;
  friendship_id: string;
  friend_id: string;
}

export type PlaylistMember = components["schemas"]["PlaylistMemberView"];
