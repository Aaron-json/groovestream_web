type ValidValueResponse = {
  valid: true;
};
type InvalidValueResponse = {
  valid: false;
  message: string;
};

export function userInfoInputValidator(
  field: "firstName" | "lastName" | "email" | "password" | "dateOfBirth",
  value: any
): ValidValueResponse | InvalidValueResponse {
  // returns a valid response when field is unexpected
  switch (field) {
    case "firstName":
      return validateFirstName(value);
    case "lastName":
      return validateLastName(value);
    case "dateOfBirth":
      return validateDateString(value);
    case "email":
      return validateEmail(value);
    case "password":
      return validatePassword(value);
    default:
      return { valid: true };
  }
}
export function validateDateString(
  dateString: string
): ValidValueResponse | InvalidValueResponse {
  const datePattern = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-([0-9]{4})$/;
  const valid = datePattern.test(dateString);
  const message = "Invalid date or format";
  return valid ? { valid } : { valid, message };
}

export function convertToTimeStamp(dateString: string): number {
  const [day, month, year] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
}

export function validateFirstName(
  firstName: string
): ValidValueResponse | InvalidValueResponse {
  const firstNamePattern = /^[a-zA-Z-]{2,}$/;
  const valid = firstNamePattern.test(firstName);
  const message = "Must contain at least two letters";
  return valid ? { valid } : { valid, message };
}

export function validateLastName(
  lastName: string
): ValidValueResponse | InvalidValueResponse {
  // same validation as first name
  return validateFirstName(lastName);
}

export function validateEmail(
  email: string
): ValidValueResponse | InvalidValueResponse {
  const emailPattern = /^[.-w]+@([.-w]+.)+[.-w]{2,4}$/;
  const valid = emailPattern.test(email);
  const message = "Invalid email";
  return valid ? { valid } : { valid, message };
}

export function validatePassword(
  password: string
): ValidValueResponse | InvalidValueResponse {
  const passwordPattern = /^(?=.*[0-9a-zA-Z]).{8,}$/;
  const valid = passwordPattern.test(password);
  const message = "Must be at least 8 characters";
  return valid ? { valid } : { valid, message };
}
