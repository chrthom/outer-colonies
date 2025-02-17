import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import OCErrorStateMatcher from '../../components/error-state-matcher';
import AuthService from 'src/app/auth.service';
import { Router, RouterLink } from '@angular/router';
import { ContentBoxComponent } from '../../components/content-box/content-box.component';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'oc-page-login',
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  imports: [
    ContentBoxComponent,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatSlideToggle,
    MatButton,
    MatError,
    RouterLink
  ]
})
export class LoginPage {
  loginFailed = false;
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
