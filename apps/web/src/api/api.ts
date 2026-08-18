export const PRIMARY_API_PROD_URL = "https://groovestream.up.railway.app";
export const PRIMARY_API_DEV_URL = "http://localhost:8081";
export const CDN_PROD_URL = "https://cdn.groovestream.app";
export const CDN_DEV_URL = "http://localhost:8787";

export const PRIMARY_API_URL = import.meta.env?.PROD
  ? PRIMARY_API_PROD_URL
  : PRIMARY_API_DEV_URL;

export const CDN_URL = import.meta.env?.PROD ? CDN_PROD_URL : CDN_DEV_URL;
