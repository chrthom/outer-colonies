import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';
import AuthApiService from 'src/app/api/auth-api.service';
import OCErrorStateMatcher from 'src/app/components/error-state-matcher';

@Component({
  selector: 'oc-page-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrl: './reset-password.page.scss'
})
export class ResetPasswordPage implements OnInit {
  passwordResetSuccessful = false;
  passwordResetFailed = false;
  loading = false;
  resetId!: string;
  resetPasswordForm: FormGroup = new FormGroup({
    password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(40)])
  });
  matcher: ErrorStateMatcher = new OCErrorStateMatcher();
  constructor(private authAPIService: AuthApiService, private route: ActivatedRoute) {}
  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => this.resetId = params.get('id')!);
  }
  get password(): any {
    return this.resetPasswordForm.get('password');
  }
  submit() {
    this.resetPasswordForm.markAllAsTouched();
    if (this.resetPasswordForm.valid && !this.loading) {
      this.loading = true;
      this.authAPIService
        .resetPassword(this.resetId, this.resetPasswordForm.value.password)
        .subscribe({
          next: () => {
            this.passwordResetSuccessful = true;
            this.loading = false;
          },
          error: () => {
            this.passwordResetFailed = true;
            this.loading = false
          }
        });
    }
  }
}
