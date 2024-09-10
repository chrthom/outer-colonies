import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Router } from '@angular/router';
import AuthService from 'src/app/auth.service';
import OCErrorStateMatcher from 'src/app/components/error-state-matcher';

@Component({
  selector: 'oc-page-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss'
})
export class ForgotPasswordPage {
  passwordResetFailed = false;
  forgotPasswordForm: FormGroup = new FormGroup({
    username: new FormControl('', [Validators.required])
  });
  matcher: ErrorStateMatcher = new OCErrorStateMatcher();
  constructor(private authService: AuthService, private router: Router) {}
  get username(): any {
    return this.forgotPasswordForm.get('username');
  }
  submit() {
    // TODO: Continue here
    /*
    this.authService
      .login(this.loginForm.value.username, this.loginForm.value.password, this.loginForm.value.remember)
      .subscribe(success => {
        if (success) this.router.navigate(['/']);
        else this.loginFailed = true;
      });
      */
  }
}
