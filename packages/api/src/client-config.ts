import type { CreateClientConfig } from "./generated/client.gen";

// Applications configure the shared singleton during startup. Keeping the
// generated default inert prevents this package from owning platform auth.
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
});
