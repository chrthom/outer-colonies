import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { map, Observable } from 'rxjs';
import AuthApiService from 'src/app/api/auth-api.service';
import { ProfileApiService } from 'src/app/api/profile-api.service';
import AuthService from 'src/app/auth.service';
import OCErrorStateMatcher from 'src/app/components/error-state-matcher';

@Component({
  selector: 'oc-page-profile',
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss'
})
export class ProfilePage implements OnInit {
  newsletterSubscription!: boolean;
  passwordResetSuccessful = false;
  emailResetSuccessful = false;
  emailForm: FormGroup = new FormGroup({
    email: new FormControl(
      '',
      [Validators.required, Validators.email, Validators.maxLength(60)],
      [this.emailExistsValidator]
    )
  });
  passwordForm: FormGroup = new FormGroup({
    password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(40)])
  });
  matcher: ErrorStateMatcher = new OCErrorStateMatcher();
  constructor(
    private authService: AuthService,
    private authAPIService: AuthApiService,
    private profileAPIService: ProfileApiService
  ) {}
  ngOnInit(): void {
    this.profileAPIService.profile.subscribe(profile => (this.newsletterSubscription = profile.newsletter));
  }
  get email(): AbstractControl | null {
    return this.emailForm.get('email');
  }
  get password(): AbstractControl | null {
    return this.passwordForm.get('password');
  }
  get username(): string | undefined {
    return this.authService.displayname;
  }
  changeEmail() {
    this.emailForm.markAllAsTouched();
    if (this.emailForm.valid) {
      this.authAPIService
        .resetEmail(this.authService.token, this.emailForm.value.email)
        .subscribe(() => (this.emailResetSuccessful = true));
    }
  }
  changePassword() {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.valid) {
      this.authAPIService
        .resetPassword(this.authService.token, this.passwordForm.value.password)
        .subscribe(() => (this.passwordResetSuccessful = true));
    }
  }
  changeNewsletter() {
    this.profileAPIService.setNewsletter(this.newsletterSubscription).subscribe(() => {
      /* Do nothing */
    });
  }
  private get emailExistsValidator(): AsyncValidatorFn {
    return (
      control: AbstractControl
    ): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
      return this.authAPIService.checkEmailExists(control.value).pipe(
        map(exists => {
          return exists ? { exists: true } : null;
        })
      );
    };
  }
}
