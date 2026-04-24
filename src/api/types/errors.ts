import { operations } from "./schema";

/**
 * Extracts the 'default' error response content for a given operation.
 */
export type ApiOpError<T extends keyof operations> =
  operations[T]["responses"]["default"] extends {
    content: { "application/json": infer E };
  }
    ? E
    : never;
