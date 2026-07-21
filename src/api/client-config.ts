import type { CreateClientConfig } from "./generated/client.gen";
import { PRIMARY_API_URL } from "./api";
import { getAuthToken } from "@/lib/supabase";

const REQUEST_TIMEOUT_MS = 20_000;

// custom fetch implementation for the generated client to use.
const fetchWithTimeout: typeof fetch = (input, init) => {
  // If there is a pre-existing signal, wrap it with a timeout signal.
  // If not, create a new one.
  const callerSignal =
    init?.signal ?? (input instanceof Request ? input.signal : undefined);
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

  const signal = callerSignal
    ? AbortSignal.any([callerSignal, timeoutSignal])
    : timeoutSignal;

  return globalThis.fetch(input, { ...init, signal });
};

// This client config export is used by the client generator
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  auth: getAuthToken,
  baseUrl: PRIMARY_API_URL,
  fetch: fetchWithTimeout,
});
