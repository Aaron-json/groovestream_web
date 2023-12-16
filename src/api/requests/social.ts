import axiosClient from "../axiosClient";

export async function getFriends(skip: number, limit: number) {
  const response = await axiosClient.get("/social/friends", {
    params: {
      skip,
      limit,
    },
  });
  return response.data;
}
export async function getFriendRequests() {
  const response = await axiosClient.get("/social/friend-requests");
  return response.data;
}
export async function sendFriendRequest(receiverEmail: string) {
  const response = await axiosClient.post("/social/friend-request", {
    requestReceiverEmail: receiverEmail,
  });
  return response.data;
}

export async function acceptFriendRequest(requestSenderID: string) {
  const response = await axiosClient.post(`/social/friend/${requestSenderID}`);
  return response.data;
}

export async function rejectFriendRequest(requestSenderID: string) {
  const response = await axiosClient.delete(
    `/social/friend-request/${requestSenderID}`
  );
  return response.data;
}

export async function getFriendProfilePicture(friendID: string) {
  const response = await axiosClient.get(
    `/social/friend/profilePicture/${friendID}`
  );
  return response.data;
}

export async function deleteFriend(friendID: string) {
  const response = await axiosClient.delete(`/social/friend/${friendID}`);
  return response.data;
}
