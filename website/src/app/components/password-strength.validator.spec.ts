import { FormControl } from '@angular/forms';
import { passwordStrength } from './password-strength.validator';

describe('passwordStrength', () => {
  it('should accept a password with at least one letter and one digit', () => {
    expect(passwordStrength(new FormControl('password1'))).toBeNull();
  });

  it('should accept unicode letters', () => {
    expect(passwordStrength(new FormControl('pässwört1'))).toBeNull();
  });

  it('should reject a password without a digit', () => {
    expect(passwordStrength(new FormControl('onlyletters'))).toEqual({ strength: true });
  });

  it('should reject a password without a letter', () => {
    expect(passwordStrength(new FormControl('12345678'))).toEqual({ strength: true });
  });

  it('should leave empty values to the required validator', () => {
    expect(passwordStrength(new FormControl(''))).toBeNull();
  });
});
