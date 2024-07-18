export interface User {
    id: number;
    username: string;
    email: string;
    dateJoined: string;
}

export interface PublicUserInfo extends Pick<User, "id" | "username"> { }

export interface ProfilePicture {
    mimeType: string;
    encoding: string;
    data: string;
}
