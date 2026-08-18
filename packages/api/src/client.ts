import { client } from "./generated/client.gen";

export type ApiClientOptions = {
  baseUrl: string;
  getAccessToken: () => Promise<string>;
  timeoutMs?: number;
};

function withTimeout(timeoutMs: number): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const callerSignal =
      init?.signal ??
      (typeof Request !== "undefined" && input instanceof Request
        ? input.signal
        : undefined);
    const abortFromCaller = () => controller.abort(callerSignal?.reason);

    if (callerSignal?.aborted) abortFromCaller();
    else callerSignal?.addEventListener("abort", abortFromCaller, { once: true });

    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await globalThis.fetch(input, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
      callerSignal?.removeEventListener("abort", abortFromCaller);
    }
  };
}

/** Configures the API singleton for the current application process. */
export function configureApiClient({
  baseUrl,
  getAccessToken,
  timeoutMs = 20_000,
}: ApiClientOptions) {
  client.setConfig({
    auth: getAccessToken,
    baseUrl: baseUrl.replace(/\/$/, ""),
    fetch: withTimeout(timeoutMs),
    throwOnError: true,
  });
}
