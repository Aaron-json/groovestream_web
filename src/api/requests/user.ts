import { ResponseError } from "../types/errors";
import { User } from "../types/user";
import axiosClient from "../axiosClient";

export async function getUser() {
  const response = await axiosClient.get<User>("/users");
  return response.data;
}

export type UserProfile = {
  username: string;
};
export async function createUserProfile(data: UserProfile) {
  const response = await axiosClient.post<any, ResponseError>("/users", data);
  return response.data;
}
export async function uploadProfilePicture(file: File) {
  return await axiosClient.put("/users/profile-picture", file, {
    headers: {
      "Content-Type": "image/" + file.type,
    },
    // set a custom timeout since the default may be too short for downloads
    timeout: 1000 * 60,
  });
}

type UserUpdateFields = {
  username?: string;
};
export async function updateUserInfo(userInfo: UserUpdateFields) {
  const res = await axiosClient.patch("/users", userInfo);
  return res.data;
}

export async function usernameExists(username: string) {
  const response = await axiosClient.get<boolean>(`/users/check-username`, {
    params: {
      username,
    },
  });
  return response.data;
}
