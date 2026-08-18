export const USERNAME_MAX_LENGTH = 32;
const USERNAME_MIN_LENGTH = 3;

/** Mirrors the username rules enforced by the API. */
export function validateUsername(username: string) {
  if (username.length < USERNAME_MIN_LENGTH) {
    return `Must be at least ${USERNAME_MIN_LENGTH} characters`;
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return `Must be no more than ${USERNAME_MAX_LENGTH} characters`;
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return "Can only contain letters, numbers, underscores, and hyphens";
  }
  if (!/[a-zA-Z]/.test(username)) {
    return "Must contain at least one letter";
  }
  if (username.startsWith("_") || username.startsWith("-")) {
    return "Cannot start with a hyphen or underscore";
  }
  if (/[_-]{2}/.test(username)) {
    return "Cannot contain consecutive hyphens or underscores";
  }
}
