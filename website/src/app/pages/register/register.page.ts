import { Component, ViewEncapsulation } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormControl, FormGroup, FormGroupDirective, NgForm, ValidationErrors, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Observable, lastValueFrom, map } from 'rxjs';
import ApiService from 'src/app/api.service';

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
  registrationSuccessful: boolean | undefined = undefined;
  registerForm: FormGroup = new FormGroup({
    username: new FormControl('', [ 
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20)
    ], [
      this.usernameExistsValidator
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
    ], [
      this.emailExistsValidator
    ]),
    startDeck: new FormControl('', [
      Validators.required
    ])
  });
  matcher: ErrorStateMatcher = new RegisterErrorStateMatcher();
  constructor(private apiService: ApiService) {}
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
  get usernameErrors(): string {
    return JSON.stringify(this.username.errors);
  }
  submit() {
    console.log(this.registerForm.value.username);
    this.apiService.register({
      username: this.registerForm.value.username,
      password: this.registerForm.value.password,
      email: this.registerForm.value.email,
      startDeck: this.registerForm.value.startDeck
    }).subscribe(success => this.registrationSuccessful = success);
  }
  private get usernameExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
      return this.apiService.checkUsernameExists(control.value).pipe(map(exists => {
        return exists ? { exists: true } : null;
      }));
    }
  }
  private get emailExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
      return this.apiService.checkEmailExists(control.value).pipe(map(exists => {
        return exists ? { exists: true } : null;
      }));
    }
  }
}
