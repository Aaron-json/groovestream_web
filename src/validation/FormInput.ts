export function validateDateString(dateString: string) {
  const message = "Please enter a valid date in the format YYYY-MM-DD";
  // Check if the string matches the format yyyy-mm-dd using regular expression
  const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  if (!dateRegex.test(dateString)) {
    return message; // If format doesn't match, return false
  }

  // Split the date string into year, month, and day parts
  const [year, month, day] = dateString.split("-").map(Number);
  // Check if the month is valid (between 1 and 12)
  if (month < 1 || month > 12) {
    return "Invalid date";
  }

  // Check if the day is valid for the given month and year
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return "Invalid date";
  }
}

export function validateFirstName(
  firstName: string
) {
  const val = firstName.trim()
  if (val.length === 0) {
    return "This field is required"
  }
  const regExp = /^[a-zA-Z]+$/
  if (!regExp.test(val)) {
    return "This field can only contain letters"
  } if (val.length < 3 || val.length > 20) {
    return "Must be 3 to 20 characters"
  }

}

export function validateLastName(
  lastName: string
) {
  // same validation as first name
  return validateFirstName(lastName);
}

export function validateUsername(
  username: string
) {
  const val = username.trim()
  if (val.length === 0) {
    return "This field is required"
  }
  const pattern = /^[a-zA-Z0-9]+$/
  if (!pattern.test(val)) {
    return "Must only contain letters or numbers"
  } if (val.length < 5 || val.length > 25) {
    return "Must be 3 to 15 characters"
  }
}

export function validatePassword(
  password: string
) {
  // password can contain whitespaces but it
  // cannot be spaces only
  const trimmed = password.trim()
  if (trimmed.length === 0) {
    return "Password is required"
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters"
  }
}
