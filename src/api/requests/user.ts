import axios from "axios";
import { ProfilePicture, User } from "../../types/user";
import axiosClient from "../axiosClient";


export async function getUser() {
  const response = await axiosClient.get("/user");
  return response.data as User
}
export async function getOwnProfilePicture() {
  const response = await axiosClient.get("/user/profilePicture");
  return response.data as ProfilePicture
}
export async function getProfilePicture(userID: number) {
  const response = await axiosClient.get(`/user/profilePicture/${userID}`)
  return response.data as ProfilePicture
}
export type SignUpData = {
  firstName: string;
  lastName: string;
  username: string;
  dateOfBirth: number;
  password: string;
};
export async function userSignUp(data: SignUpData) {
  const response = await axiosClient.post("/user", data);
  return response.data;
}
export async function uploadProfilePicture(formData: FormData) {
  return await axiosClient.put("/user/profilePicture", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    // set a custom timeout since the default may be too short for downloads
    timeout: 1000 * 60
  });
}

type UserUpdateFields = {
  firstName?: string,
  lastName?: string,
  username?: string,
  dateOfBirth?: string
}
export async function updateUserInfo(userInfo: UserUpdateFields) {
  const res = await axiosClient.patch("/user", userInfo)
  return res.data
}