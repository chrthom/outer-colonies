import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import OCErrorStateMatcher from '../../components/error-state-matcher';
import AuthService from 'src/app/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'oc-page-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage {
  loginFailed: boolean = false;
  loginForm: FormGroup = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    remember: new FormControl(false, [])
  });
  matcher: ErrorStateMatcher = new OCErrorStateMatcher();
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  get username(): any {
    return this.loginForm.get('username');
  }
  get password(): any {
    return this.loginForm.get('password');
  }
  submit() {
    this.authService
      .login(this.loginForm.value.username, this.loginForm.value.password, this.loginForm.value.remember)
      .subscribe(success => {
        if (success) this.router.navigate(['/']);
        else this.loginFailed = true;
      });
  }
}
