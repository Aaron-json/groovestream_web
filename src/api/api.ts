import axios from "axios";

export const PRIMARY_API_PROD_URL = "https://groovestream.up.railway.app";
export const PRIMARY_API_DEV_URL = "http://localhost:8081";
export const CDN_PROD_URL = "https://cdn.groovestream.app";
export const CDN_DEV_URL = "http://localhost:8787";

export const PRIMARY_API_URL = import.meta.env?.PROD
  ? PRIMARY_API_PROD_URL
  : PRIMARY_API_DEV_URL;

export const CDN_URL = import.meta.env?.PROD ? CDN_PROD_URL : CDN_DEV_URL;

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
