import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import AuthApiService from 'src/app/api/auth-api.service';
import OCErrorStateMatcher from 'src/app/components/error-state-matcher';
import { ContentBoxComponent } from '../../components/content-box/content-box.component';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'oc-page-forgot-password',
    templateUrl: './forgot-password.page.html',
    styleUrls: ['./forgot-password.page.scss'],
    imports: [ContentBoxComponent, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatButton, MatError, RouterLink]
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
      this.authAPIService.forgotPassword(this.forgotPasswordForm.value.username.trim()).subscribe({
        next: () => (this.passwordResetSuccessful = true),
        error: () => {
          this.passwordResetFailed = true;
          this.loading = false;
        }
      });
    }
  }
}
