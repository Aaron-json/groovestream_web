import { InternalAxiosRequestConfig } from "axios";
import axiosClient from "../api/axiosClient";

type tokenProvider = () => string | Promise<string>

const NO_INTERCEPTOR_URLS = [{
  // do not intercept requests to supabase auth endpoints
  URL: "/user",
  METHOD: "post"
}]

export function setRequestInterceptor(getToken: tokenProvider) {
  axiosClient.interceptors.request.use((config) => onFulfilled(config, getToken), undefined)
}

async function onFulfilled(config: InternalAxiosRequestConfig, getToken: tokenProvider) {
  if (NO_INTERCEPTOR_URLS.some(url => url.URL === config.url && url.METHOD.toLowerCase() === config.method?.toLowerCase())) {
    return config
  }
  const token = await getToken()
  config.headers.Authorization = "Bearer " + token

  return config
}
