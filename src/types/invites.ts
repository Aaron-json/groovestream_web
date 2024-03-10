import { Playlist } from "./media.js";
import { PublicUserInfo } from "./user.js";
interface Invite {
    id: number;
    from: PublicUserInfo;
    to: PublicUserInfo;
    sentAt: string;
}

export interface PlaylistInvite extends Invite {
    playlist: Pick<Playlist, "name" | "owner" | "id">;
}

export interface FriendRequest extends Invite { }
