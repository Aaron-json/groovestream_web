import axios from "axios";

const HOST_NAME = "http://localhost:5001"
const axiosClient = axios.create({
    baseURL: HOST_NAME,
    withCredentials: false,
    headers: {
        "Content-Type": "application/json"
    }
})

export default axiosClient