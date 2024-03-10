import axiosClient from "../axiosClient";
type LoginCredentials = {
  username: string;
  password: String;
};
export async function login(loginCreds: LoginCredentials) {
  const response = await axiosClient.post("auth/login", loginCreds);
  return response.data;
}

export async function logout() {
  const response = await axiosClient.post("/auth/logout");
  return response.data;
}

export async function refreshAuth() {
  const response = await axiosClient.post("/auth/refresh");
  return response.data;
}
