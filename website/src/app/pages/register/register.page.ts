import { Component, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

export class RegisterErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'oc-page-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RegisterPage {
  registerForm: FormGroup = new FormGroup({
    username: new FormControl('', [ 
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20)
    ]),
    password: new FormControl('', [ 
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(40)
    ]),
    email: new FormControl('', [
      Validators.required,
      Validators.email,
      Validators.maxLength(60)
    ]),
    startDeck: new FormControl('', [
      Validators.required
    ])
  });
  matcher: ErrorStateMatcher = new RegisterErrorStateMatcher();
  get username(): any {
    return this.registerForm.get('username');
  }
  get password(): any {
    return this.registerForm.get('password');
  }
  get email(): any {
    return this.registerForm.get('email');
  }
  get startDeck(): any {
    return this.registerForm.get('startDeck');
  }
  submit() {
    console.log('SUBMIT'); //// TODO: Continue here
  }
}
