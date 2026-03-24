import { FormControl, FormGroup, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import OCErrorStateMatcher from './error-state-matcher';

describe('OCErrorStateMatcher', () => {
  let matcher: OCErrorStateMatcher;

  beforeEach(() => {
    matcher = new OCErrorStateMatcher();
  });

  it('should be created', () => {
    expect(matcher).toBeTruthy();
  });

  it('should return false when control is null', () => {
    expect(matcher.isErrorState(null, null)).toBeFalse();
  });

  it('should return false when control is valid', () => {
    const control = new FormControl('valid value');
    expect(matcher.isErrorState(control, null)).toBeFalse();
  });

  it('should return true when control is invalid and dirty', () => {
    const control = new FormControl('', { validators: [Validators.required] });
    control.markAsDirty();
    expect(matcher.isErrorState(control, null)).toBeTrue();
  });

  it('should return true when control is invalid and touched', () => {
    const control = new FormControl('', { validators: [Validators.required] });
    control.markAsTouched();
    expect(matcher.isErrorState(control, null)).toBeTrue();
  });

  it('should return true when form is submitted and control is invalid', () => {
    const control = new FormControl('', { validators: [Validators.required] });
    const formGroup = new FormGroup({ test: control });
    const formDirective = new FormGroupDirective([], []);
    formDirective.form = formGroup;
    formDirective.submitted = true;
    expect(matcher.isErrorState(control, formDirective)).toBeTrue();
  });

  it('should return false when control is invalid but pristine and untouched', () => {
    const control = new FormControl('', { validators: [Validators.required] });
    expect(matcher.isErrorState(control, null)).toBeFalse();
  });
});
