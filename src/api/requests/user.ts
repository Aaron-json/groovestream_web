import axiosClient from "../axiosClient";

export async function getUserFields(fields: string[], config: RequestConfig) {
  const response = await axiosClient.get("/user", {
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
    },
    params: {
      fields,
    },
  });
  return response.data;
}
