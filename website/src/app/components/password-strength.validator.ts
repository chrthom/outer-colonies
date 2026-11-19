import { AbstractControl, ValidationErrors } from '@angular/forms';
import { passwordHasLetterAndDigit } from '@shared/config/password_rules';

/**
 * Requires the shared password character rule (at least one letter and one digit, defined
 * once in `@shared/config/password_rules` and also enforced by the server-side request
 * validation) so the password forms reject weak passwords before they are submitted.
 * Non-string and empty values are left to the `required` and length validators.
 * @param control the password form control to validate
 * @returns `null` if the password satisfies the character rule, `{ strength: true }` otherwise
 */
export function passwordStrength(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (typeof value !== 'string' || value === '') return null;
  return passwordHasLetterAndDigit(value) ? null : { strength: true };
}
