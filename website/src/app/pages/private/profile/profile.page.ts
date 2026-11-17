import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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
import { Observable, Subject, catchError, map, of, switchMap, takeUntil, timer } from 'rxjs';
import AuthApiService from 'src/app/api/auth-api.service';
import { ProfileApiService } from 'src/app/api/profile-api.service';
import AuthService from 'src/app/auth.service';
import { environment } from 'src/environments/environment';
import OCErrorStateMatcher from 'src/app/components/error-state-matcher';
import { ContentBoxComponent } from '../../../components/content-box/content-box.component';
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
export class ProfilePage implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private authAPIService = inject(AuthApiService);
  private profileAPIService = inject(ProfileApiService);
  private destroy$ = new Subject<void>();

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
      error: err => {
        /* The swallow is mandatory: RxJS rethrows errors of handler-less subscriptions as
           uncaught exceptions. The failure is logged with a level (gated to non-production
           stages) and the default newsletter state is kept */
        if (environment.stage !== 'production') {
          console.warn(`Failed to load profile with status ${err?.status}, keeping default newsletter state`);
        }
      }
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.invalid) {
        return of(null);
      }
      // Angular cancels the previous async validation subscription on every value change,
      // so the delay acts as a debounce while typing
      return timer(300).pipe(
        switchMap(() => this.authAPIService.checkEmailExists(control.value)),
        map(exists => (exists ? { exists: true } : null)),
        catchError(err => {
          // A failed availability check must not block the email address change (the server
          // re-checks on submit), so the validator degrades to "no error"; the failure is
          // logged with a level, gated to non-production stages
          if (environment.stage !== 'production') {
            console.warn(
              `Email availability check failed with status ${err?.status}, treating email as available`
            );
          }
          return of(null);
        }),
        takeUntil(this.destroy$)
      );
    };
  }
}
