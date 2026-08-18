import { configureApiClient } from "@groovestream/api/client";
import { env } from "./env";
import { getAccessToken } from "./supabase";

configureApiClient({
  baseUrl: env.apiUrl,
  getAccessToken,
});
