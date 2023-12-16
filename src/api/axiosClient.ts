import axios from "axios";

// export const DEV_HOST_NAME = "http://localhost:5001";
// export const NETWORK_DEV_HOST_NAME = "http://192.168.1.72:5001";
export const PROD_HOST_NAME = "https://fine-craft-385619.nn.r.appspot.com";
const axiosClient = axios.create({
  baseURL: PROD_HOST_NAME,
  withCredentials: true,
  // ovverride the content type header if you are not sending json data in your request
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosClient;
