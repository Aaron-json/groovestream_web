import { FriendRequest } from "../types/invites";
import { Friend } from "../types/relations";
import axiosClient from "../axiosClient";
import { User } from "../types/user";

export async function getFriends(limit?: number, skip?: number) {
  const params: any = {};
  if (skip) {
    params.skip = skip;
  }
  if (limit) {
    params.limit = limit;
  }
  const response = await axiosClient.get<Friend[]>("/friends", { params });
  return response.data;
}
export async function getFriendRequests() {
  const response = await axiosClient.get<FriendRequest[]>("/friend-requests");
  return response.data;
}
export async function sendFriendRequest(username: string) {
  const response = await axiosClient.post("/friend-requests", {
    username,
  });
  return response.data;
}

export async function acceptFriendRequest(senderID: User["id"]) {
  const response = await axiosClient.post(
    `/friend-requests/${senderID}/accept`,
  );
  return response.data;
}

export async function rejectFriendRequest(senderID: User["id"]) {
  const response = await axiosClient.delete(`/friend-requests/${senderID}`);
  return response.data;
}
export async function deleteFriend(friendID: Friend["friend_id"]) {
  const response = await axiosClient.delete(`/friends/${friendID}`);
  return response.data;
}
