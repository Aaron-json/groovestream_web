import axios from "axios";

export const PRIMARY_API_URL = import.meta.env.PROD
  ? "https://api.groovestream.app"
  : "http://localhost:8081";

export const STREAMING_API_URL = import.meta.env.PROD
  ? "https://media-api.groovestream.app"
  : "http://localhost:8082";

// The client is created with the primary URL, for request to another url, override the baseUrl in
// your request config
const axiosClient = axios.create({
  baseURL: PRIMARY_API_URL,
});
axiosClient.defaults.timeout = 1000 * 20;
axiosClient.defaults.withCredentials = true;
// override the content type header if you are not sending json data in your request
axiosClient.defaults.headers["Content-Type"] = "application/json";

export default axiosClient;
