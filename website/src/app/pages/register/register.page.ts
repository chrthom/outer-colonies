import { Component } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
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
  styleUrls: ['./register.page.scss']
})
export class RegisterPage {
  username: string = '';
  usernameFormControl = new FormControl('', [ 
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(20)
  ]);
  password: string = '';
  passwordFormControl = new FormControl('', [ 
    Validators.required,
    Validators.minLength(8),
    Validators.maxLength(40)
  ]);
  email: string = '';
  emailFormControl = new FormControl('', [
    Validators.required,
    Validators.email,
    Validators.maxLength(60)
  ]);
  matcher: ErrorStateMatcher = new RegisterErrorStateMatcher();
}
