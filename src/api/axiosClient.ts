import axios, { AxiosInstance } from "axios";

const HOST_NAME = "http://localhost:5001"
const axiosClient : AxiosInstance = axios.create({
    baseURL: HOST_NAME,
    withCredentials: true,
    // ovverride the content type header if you are not sending json data in your request
    headers: {
        "Content-Type": "application/json"
    }
})

export default axiosClient