import axiosClient from "../axiosClient";

export async function getUserFields(fields: string[], config?: RequestConfig) {
  const response = await axiosClient.get("/user", {
    params: {
      fields,
    },
  });
  return response.data;
}
