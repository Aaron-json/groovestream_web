import axiosClient from "../api";
import { components } from "../types/schema";
import { OpBundle } from "../types/helpers";

// Domain Types
export type User = components["schemas"]["User"];

type GetUsers = OpBundle<"get-users">;
export type UserResponse = GetUsers["Response"];
export type GetUserError = GetUsers["Error"];

export async function getUser() {
  const response = await axiosClient.get<UserResponse>("/users");
  return response.data;
}

type CreateUser = OpBundle<"post-users">;
export type UserProfile = CreateUser["Body"];
export type CreateUserError = CreateUser["Error"];

export async function createUserProfile(body: UserProfile) {
  const response = await axiosClient.post<CreateUser["Response"]>(
    "/users",
    body,
  );
  return response.data;
}

type UpdateUser = OpBundle<"patch-users">;
export type UserUpdateFields = UpdateUser["Body"];
export type UpdateUserError = UpdateUser["Error"];

export async function updateUserInfo(body: UserUpdateFields) {
  const res = await axiosClient.patch<UpdateUser["Response"]>(
    "/users",
    body,
  );
  return res.data;
}

type CheckUsername = OpBundle<"get-users-check-username">;
export type CheckUsernameError = CheckUsername["Error"];
export async function usernameExists(params: CheckUsername["Query"]) {
  const response = await axiosClient.get<CheckUsername["Response"]>(
    `/users/check-username`,
    {
      params,
    },
  );
  return response.data;
}
