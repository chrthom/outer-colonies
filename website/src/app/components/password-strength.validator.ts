import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Requires at least one letter and one digit in a password, mirroring the strength rule of
 * the server-side request validation (see `server/src/components/utils/request_validation.ts`)
 * so the password forms reject weak passwords before they are submitted. Non-string and
 * empty values are left to the `required` and length validators.
 * @param control the password form control to validate
 * @returns `null` if the password contains a letter and a digit, `{ strength: true }` otherwise
 */
export function passwordStrength(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (typeof value !== 'string' || value === '') return null;
  return /\p{L}/u.test(value) && /\d/.test(value) ? null : { strength: true };
}
