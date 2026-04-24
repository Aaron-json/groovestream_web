import { components } from "./schema";

export type PlaylistInvite = components["schemas"]["PlaylistInviteView"];

export interface FriendRequest {
  id: string;
  from_id: string;
  from_username: string;
  to_id: string;
  created_at: string;
}
