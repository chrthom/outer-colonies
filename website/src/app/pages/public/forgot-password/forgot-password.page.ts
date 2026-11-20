import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import AuthApiService from 'src/app/api/auth-api.service';
import OCErrorStateMatcher from 'src/app/components/error-state-matcher';
import { ContentBoxComponent } from '../../../components/content-box/content-box.component';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'oc-page-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  imports: [
    ContentBoxComponent,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatButton,
    MatError,
    RouterLink
  ]
})
export class ForgotPasswordPage {
  private authAPIService = inject(AuthApiService);

  passwordResetSuccessful = false;
  passwordResetFailed = false;
  loading = false;
  forgotPasswordForm: FormGroup = new FormGroup({
    username: new FormControl('', [Validators.required])
  });
  matcher: ErrorStateMatcher = new OCErrorStateMatcher();
  get username(): AbstractControl | null {
    return this.forgotPasswordForm.get('username');
  }
  /** Requests recovery for either a username or an email address, once at a time. */
  submit() {
    this.forgotPasswordForm.markAllAsTouched();
    if (this.forgotPasswordForm.valid && !this.loading) {
      this.loading = true;
      this.passwordResetFailed = false;
      this.authAPIService.forgotPassword(this.forgotPasswordForm.value.username.trim()).subscribe({
        next: () => (this.passwordResetSuccessful = true),
        error: () => {
          if (environment.stage !== 'production') console.warn('Password recovery request failed');
          this.passwordResetFailed = true;
          this.loading = false;
        }
      });
    }
  }
}
