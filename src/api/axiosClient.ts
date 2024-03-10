import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.PROD ? import.meta.env.VITE_API_URL : import.meta.env.VITE_DEV_API_URL,
  // override the content type header if you are not sending json data in your request
});
// timeout for all requests. Independent requests can set their own timeouts but it has to be less than this
axiosClient.defaults.timeout = 1000 * 20
axiosClient.defaults.withCredentials = true
axiosClient.defaults.headers["Content-Type"] = "application/json"

export default axiosClient;
