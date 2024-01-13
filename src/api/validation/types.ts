type FormState =
  | FormInputState
  | FormErrorState
  | FormLoadingState
  | FormSubmittedState;
type FormInputState = {
  // this should only be present on initial render before
  // any submit action is prompted
  state: "input";
};
type FormErrorState = {
  state: "error";
  message: string;
};
type FormLoadingState = {
  state: "loading";
  message?: string;
};
type FormSubmittedState = {
  state: "submitted";
  message?: string;
};
