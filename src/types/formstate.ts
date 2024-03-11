export type FormState =
    | FormInputState
    | FormErrorState
    | FormLoadingState
    | FormSubmittedState;
export type FormInputState = {
    // this should only be present on initial render before
    // any submit action is prompted
    state: "input";
};
export type FormErrorState = {
    state: "error";
    message: string;
};
export type FormLoadingState = {
    state: "loading";
    message?: string;
};
export type FormSubmittedState = {
    state: "submitted";
    message?: string;
};
