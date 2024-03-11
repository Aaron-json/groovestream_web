import axios from "axios";
const API_URL = "https://fine-craft-385619.nn.r.appspot.com"
const DEV_API_URL = "http://localhost:5001"
const axiosClient = axios.create({
  baseURL: import.meta.env.PROD ? API_URL : DEV_API_URL,
});
// timeout for all requests. Independent requests can set their own timeouts
// if they take longer. ex - media upload
axiosClient.defaults.timeout = 1000 * 20
axiosClient.defaults.withCredentials = true
// override the content type header if you are not sending json data in your request
axiosClient.defaults.headers["Content-Type"] = "application/json"

export default axiosClient;
