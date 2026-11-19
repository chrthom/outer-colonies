import { FormControl } from '@angular/forms';
import { emailFormat } from './email-format.validator';

describe('emailFormat', () => {
  it('accepts supported local-part characters', () => {
    expect(emailFormat(new FormControl('a%b@example.com'))).toBeNull();
    expect(emailFormat(new FormControl('a!b@example.com'))).toBeNull();
  });

  it('rejects malformed addresses with the email error used by the forms', () => {
    expect(emailFormat(new FormControl('a..b@example.com'))).toEqual({ email: true });
    expect(emailFormat(new FormControl('invalid-email'))).toEqual({ email: true });
  });

  it('leaves empty values to the required validator', () => {
    expect(emailFormat(new FormControl(''))).toBeNull();
    expect(emailFormat(new FormControl(null))).toBeNull();
  });
});
