import { Component, inject } from '@angular/core';
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
import { ErrorStateMatcher, MatOption } from '@angular/material/core';
import { Observable, map } from 'rxjs';
import AuthApiService from 'src/app/api/auth-api.service';
import OCErrorStateMatcher from '../../components/error-state-matcher';
import { MultipleCards, starterDecks } from '@shared/config/starter_decks';
import { CardImageService } from 'src/app/card-image.service';
import { MatDialog } from '@angular/material/dialog';
import { DataPrivacyPage } from '../data-privacy/data-privacy.page';
import { ContentBoxComponent } from '../../components/content-box/content-box.component';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardImage } from '@angular/material/card';
import { MatBadge } from '@angular/material/badge';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'oc-page-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [
    ContentBoxComponent,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatSelect,
    MatOption,
    MatCheckbox,
    MatButton,
    MatCard,
    MatBadge,
    MatCardImage,
    RouterLink
  ]
})
export class RegisterPage {
  private authAPIService = inject(AuthApiService);
  private dialog = inject(MatDialog);
  protected readonly cardImage = inject(CardImageService);

  registrationSuccessful: boolean | undefined = undefined;
  registerForm: FormGroup = new FormGroup({
    username: new FormControl(
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(20)],
      [this.usernameExistsValidator]
    ),
    password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(40)]),
    email: new FormControl(
      '',
      [Validators.required, Validators.email, Validators.maxLength(60)],
      [this.emailExistsValidator]
    ),
    starterDeck: new FormControl('', [Validators.required]),
    dataPrivacy: new FormControl(false, [Validators.requiredTrue]),
    newsletter: new FormControl(false)
  });
  matcher: ErrorStateMatcher = new OCErrorStateMatcher();
  get username(): AbstractControl | null {
    return this.registerForm.get('username');
  }
  get password(): AbstractControl | null {
    return this.registerForm.get('password');
  }
  get email(): AbstractControl | null {
    return this.registerForm.get('email');
  }
  get starterDeck(): AbstractControl | null {
    return this.registerForm.get('starterDeck');
  }
  get dataPrivacy(): AbstractControl | null {
    return this.registerForm.get('dataPrivacy');
  }
  get newsletter(): AbstractControl | null {
    return this.registerForm.get('newsletter');
  }
  get usernameErrors(): string {
    return JSON.stringify(this.username?.errors);
  }
  get starterDeckCards(): MultipleCards[] {
    return starterDecks[this.starterDeck?.value] ?? [];
  }
  submit() {
    this.registerForm.markAllAsTouched();
    if (this.registerForm.valid) {
      this.authAPIService
        .register({
          username: this.registerForm.value.username.trim(),
          password: this.registerForm.value.password,
          email: this.registerForm.value.email.trim(),
          starterDeck: this.registerForm.value.starterDeck,
          newsletter: !!this.registerForm.value.newsletter
        })
        .subscribe({
          next: () => (this.registrationSuccessful = true),
          error: () => (this.registrationSuccessful = false)
        });
    }
  }
  openDataPrivacy() {
    this.dialog.open(DataPrivacyPage);
  }
  private get usernameExistsValidator(): AsyncValidatorFn {
    return (
      control: AbstractControl
    ): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
      return this.authAPIService.checkUsernameExists(control.value).pipe(
        map(exists => {
          return exists ? { exists: true } : null;
        })
      );
    };
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
