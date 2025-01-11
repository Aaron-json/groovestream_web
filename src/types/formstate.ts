// useful when not using a form library that handles
// the state for you
export type FormState = {
  state: "input" | "loading" | "error" | "successful";
  message?: string;
};
