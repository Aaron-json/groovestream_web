import { operations } from "./schema";

/**
 * Valid success status codes (2xx range).
 */
type SuccessStatuses =
  | 200
  | 201
  | 202
  | 203
  | 204
  | 205
  | 206
  | 207
  | 208
  | 226;

/**
 * Extracts the 'default' error response content for a given operation.
 */
export type OpError<T extends keyof operations> =
  operations[T]["responses"]["default"] extends {
    content: { "application/json": infer E };
  }
    ? E
    : never;

/**
 * Extracts the path parameters for a given operation.
 */
export type OpPath<T extends keyof operations> =
  operations[T]["parameters"]["path"];

/**
 * Extracts the query parameters for a given operation.
 */
export type OpQuery<T extends keyof operations> =
  operations[T]["parameters"]["query"];

/**
 * Extracts the JSON request body for a given operation.
 */
export type OpBody<T extends keyof operations> =
  operations[T]["requestBody"] extends {
    content: { "application/json": infer B };
  }
    ? B
    : never;

/**
 * Extracts the JSON response for a given operation and success status code.
 * Defaults to any status code in the 2xx range.
 */
export type OpResponse<
  T extends keyof operations,
  S extends keyof operations[T]["responses"] = Extract<
    keyof operations[T]["responses"],
    SuccessStatuses | `${SuccessStatuses}`
  >,
> = operations[T]["responses"][S] extends {
  content: { "application/json": infer R };
}
  ? R
  : never;

/**
 * A type-safe operation ID.
 */
export type ApiOp<T extends keyof operations> = T;

/**
 * A consolidated type bundle for an operation.
 */
export type OpBundle<T extends keyof operations> = {
  Path: OpPath<T>;
  Query: OpQuery<T>;
  Body: OpBody<T>;
  Response: OpResponse<T>;
  Error: OpError<T>;
};

// Keep this as a fallback for generic errors
export type ResponseError = OpError<any>;
