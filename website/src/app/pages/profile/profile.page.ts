import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { map, Observable } from 'rxjs';
import AuthApiService from 'src/app/api/auth-api.service';
import { ProfileApiService } from 'src/app/api/profile-api.service';
import AuthService from 'src/app/auth.service';
import OCErrorStateMatcher from 'src/app/components/error-state-matcher';
import { ContentBoxComponent } from '../../components/content-box/content-box.component';
import { MatFormField, MatLabel, MatError, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatSlideToggle } from '@angular/material/slide-toggle';

@Component({
  selector: 'oc-page-profile',
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
  imports: [
    ContentBoxComponent,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    ReactiveFormsModule,
    MatError,
    MatHint,
    MatButton,
    MatSlideToggle
  ]
})
export class ProfilePage implements OnInit {
  private authService = inject(AuthService);
  private authAPIService = inject(AuthApiService);
  private profileAPIService = inject(ProfileApiService);

  newsletterSubscription!: boolean;
  passwordResetSuccessful = false;
  passwordResetFailed = false;
  emailResetSuccessful = false;
  emailResetFailed = false;
  newsletterUpdateFailed = false;
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
  ngOnInit(): void {
    this.profileAPIService.profile.subscribe({
      next: profile => (this.newsletterSubscription = profile.newsletter),
      error: err => console.error('Failed to load profile', err)
    });
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
      this.emailResetFailed = false;
      this.authAPIService.resetEmail(this.emailForm.value.email).subscribe({
        next: () => (this.emailResetSuccessful = true),
        error: () => (this.emailResetFailed = true)
      });
    }
  }
  changePassword() {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.valid) {
      this.passwordResetFailed = false;
      this.authAPIService.resetPassword(this.passwordForm.value.password).subscribe({
        next: () => (this.passwordResetSuccessful = true),
        error: () => (this.passwordResetFailed = true)
      });
    }
  }
  changeNewsletter() {
    this.newsletterUpdateFailed = false;
    this.profileAPIService.setNewsletter(this.newsletterSubscription).subscribe({
      next: () => {
        /* Do nothing */
      },
      error: () => (this.newsletterUpdateFailed = true)
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
