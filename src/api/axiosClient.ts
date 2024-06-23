import axios from "axios";

export const PRIMARY_API_URL = import.meta.env.PROD ? import.meta.env.VITE_API_URL : import.meta.env.VITE_DEV_API_URL

export const STREAMING_API_URL = import.meta.env.PROD ? import.meta.env.VITE_STREAMING_API_URL : import.meta.env.VITE_DEV_STREAMING_API_URL

// The client is created with the primary URL, for request to another url, override the baseUrl in
// your request config
const axiosClient = axios.create({
  baseURL: PRIMARY_API_URL
});
// timeout for all requests. Independent requests can set their own timeouts
// if they take longer. ex - media upload
axiosClient.defaults.timeout = 1000 * 20
axiosClient.defaults.withCredentials = true
// override the content type header if you are not sending json data in your request
axiosClient.defaults.headers["Content-Type"] = "application/json"

export default axiosClient;
