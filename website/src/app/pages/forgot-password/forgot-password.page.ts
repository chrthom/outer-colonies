import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import AuthApiService from 'src/app/api/auth-api.service';
import OCErrorStateMatcher from 'src/app/components/error-state-matcher';

@Component({
  selector: 'oc-page-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss'
})
export class ForgotPasswordPage {
  passwordResetSuccessful = false;
  passwordResetFailed = false;
  loading = false;
  forgotPasswordForm: FormGroup = new FormGroup({
    username: new FormControl('', [Validators.required])
  });
  matcher: ErrorStateMatcher = new OCErrorStateMatcher();
  constructor(private authAPIService: AuthApiService) {}
  get username(): any {
    return this.forgotPasswordForm.get('username');
  }
  submit() {
    this.forgotPasswordForm.markAllAsTouched();
    if (this.forgotPasswordForm.valid && !this.loading) {
      this.loading = true;
      this.authAPIService
        .forgotPassword(this.forgotPasswordForm.value.username.trim())
        .subscribe({
          next: () => this.passwordResetSuccessful = true,
          error: () => {
            this.passwordResetFailed = true;
            this.loading = false
          }
        });
    }
  }
}
