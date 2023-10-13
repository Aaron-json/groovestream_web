export function validateDateString(dateString: string): boolean {
  const datePattern = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-([0-9]{4})$/;
  return datePattern.test(dateString);
}

export function convertToTimeStamp(dateString: string): number {
  const [day, month, year] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
}

export function validateFirstName(firstName: string): boolean {
  const firstNamePattern = /^[a-zA-Z-]{2,}$/;
  return firstNamePattern.test(firstName);
}

export function validateLastName(lastName: string): boolean {
  // same validation as first name
  return validateFirstName(lastName);
}

export function validateEmail(email: string): boolean {
  const emailPattern = /^[.-w]+@([.-w]+.)+[.-w]{2,4}$/;
  return emailPattern.test(email);
}

export function validatePassword(password: string): boolean {
  const passwordPattern = /^(?=.*[a-zA-Z]).{8,}$/;
  return passwordPattern.test(password);
}
