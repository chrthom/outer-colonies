/**
 * Password character rule shared by the server-side request validation
 * (`server/src/components/utils/request_validation.ts`) and the website's
 * `passwordStrength` validator, so the rule exists exactly once: a newly set password
 * must contain at least one letter and one digit. Length bounds are not part of this
 * rule; they live next to the consumers (the server schema and the website forms).
 * @param password the password to check
 * @returns `true` if the password contains at least one letter and one digit
 */
export function passwordHasLetterAndDigit(password: string): boolean {
  return /\p{L}/u.test(password) && /\d/.test(password);
}
