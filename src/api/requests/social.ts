import { FriendRequest } from "../../types/invites";
import { Friend } from "../../types/relations";
import axiosClient from "../axiosClient";

export async function getFriends(skip?: number, limit?: number) {
  const response = await axiosClient.get("/social/friends", {
    params: {
      skip,
      limit,
    },
  });
  return response.data as Friend[];
}
export async function getFriendRequests() {
  const response = await axiosClient.get("/social/friend-requests");
  return (response.data as Omit<FriendRequest, "to">[]);
}
export async function sendFriendRequest(username: string) {
  const response = await axiosClient.post("/social/friend-request", {
    username,
  });
  return response.data;
}

export async function acceptFriendRequest(requestID: number, senderID: number) {
  const response = await axiosClient.post(`/social/friend/${requestID}/${senderID}`);
  return response.data;
}

export async function rejectFriendRequest(requestID: number) {
  const response = await axiosClient.delete(
    `/social/friend-request/${requestID}`
  );
  return response.data;
}
export async function deleteFriend(friendshipID: number) {
  const response = await axiosClient.delete(`/social/friend/${friendshipID}`);
  return response.data;
}
