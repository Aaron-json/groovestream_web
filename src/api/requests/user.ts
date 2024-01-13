import axiosClient from "../axiosClient";

export async function getUserFields(fields: string[]) {
  const response = await axiosClient.get("/user", {
    params: {
      fields,
    },
  });
  return response.data;
}

export type SignUpData = {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: number;
  password: string;
};
export async function userSignUp(data: SignUpData) {
  const response = await axiosClient.post("/user", data);
  return response.data;
}
