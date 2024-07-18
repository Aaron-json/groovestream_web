export type FormState = {
    state: "input" | "error" | "loading" | "submitted";
    message?: string;
}
