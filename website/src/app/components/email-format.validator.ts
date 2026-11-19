import { AbstractControl, ValidationErrors } from '@angular/forms';
import { isValidEmail } from '@shared/config/email_rules';

/**
 * Validates email format using the same rule as the server. Empty values are left to the
 * required validator.
 * @param control the email form control to validate
 * @returns `null` for an empty or valid value, otherwise an email validation error
 */
export function emailFormat(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === '' || value == null) return null;
  return typeof value === 'string' && isValidEmail(value) ? null : { email: true };
}
