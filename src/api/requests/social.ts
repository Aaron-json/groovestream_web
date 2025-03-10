import { FriendRequest } from "../types/invites";
import { Friend } from "../types/relations";
import axiosClient from "../axiosClient";

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

export async function acceptFriendRequest(senderID: number) {
  const response = await axiosClient.post(
    `/friend-requests/${senderID}/accept`,
  );
  return response.data;
}

export async function rejectFriendRequest(senderID: number) {
  const response = await axiosClient.delete(`/friend-requests/${senderID}`);
  return response.data;
}
export async function deleteFriend(friendID: number) {
  const response = await axiosClient.delete(`/friends/${friendID}`);
  return response.data;
}
