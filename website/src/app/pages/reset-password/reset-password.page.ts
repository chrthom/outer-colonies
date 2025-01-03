import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import AuthApiService from 'src/app/api/auth-api.service';
import OCErrorStateMatcher from 'src/app/components/error-state-matcher';
import { ContentBoxComponent } from '../../components/content-box/content-box.component';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'oc-page-reset-password',
    templateUrl: './reset-password.page.html',
    styleUrls: ['./reset-password.page.scss'],
    imports: [ContentBoxComponent, RouterLink, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatError, MatButton]
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
  constructor(
    private authAPIService: AuthApiService,
    private route: ActivatedRoute
  ) {}
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => (this.resetId = params.get('id')!));
  }
  get password(): any {
    return this.resetPasswordForm.get('password');
  }
  submit() {
    this.resetPasswordForm.markAllAsTouched();
    if (this.resetPasswordForm.valid && !this.loading) {
      this.loading = true;
      this.authAPIService
        .resetPasswordViaMagicLink(this.resetId, this.resetPasswordForm.value.password)
        .subscribe({
          next: () => (this.passwordResetSuccessful = true),
          error: () => {
            this.passwordResetFailed = true;
            this.loading = false;
          }
        });
    }
  }
}
