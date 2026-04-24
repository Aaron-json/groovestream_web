import axiosClient from "../api";
import { operations } from "../types/schema";
import { ApiOpError } from "../types/errors";

export type UserResponse =
  operations["get-users"]["responses"]["200"]["content"]["application/json"];
export type GetUserError = ApiOpError<"get-users">;

export async function getUser() {
  const response = await axiosClient.get<UserResponse>("/users");
  return response.data;
}

export type UserProfile =
  operations["post-users"]["requestBody"]["content"]["application/json"];
export type CreateUserError = ApiOpError<"post-users">;

export async function createUserProfile(data: UserProfile) {
  const response = await axiosClient.post<
    operations["post-users"]["responses"]["200"]["content"]["application/json"]
  >("/users", data);
  return response.data;
}

export type UserUpdateFields =
  operations["patch-users"]["requestBody"]["content"]["application/json"];
export type UpdateUserError = ApiOpError<"patch-users">;

export async function updateUserInfo(userInfo: UserUpdateFields) {
  const res = await axiosClient.patch<
    operations["patch-users"]["responses"]["200"]["content"]["application/json"]
  >("/users", userInfo);
  return res.data;
}

export type CheckUsernameError = ApiOpError<"get-users-check-username">;
export async function usernameExists(username: string) {
  const response = await axiosClient.get<
    operations["get-users-check-username"]["responses"]["200"]["content"]["application/json"]
  >(`/users/check-username`, {
    params: {
      username,
    },
  });
  return response.data;
}
