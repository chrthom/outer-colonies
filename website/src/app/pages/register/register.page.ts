import { Component } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Observable, map } from 'rxjs';
import AuthApiService from 'src/app/api/auth-api.service';
import OCErrorStateMatcher from '../../components/error-state-matcher';
import { MultipleCards, starterDecks } from '../../../../../server/src/shared/config/starter_decks';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { ImageModalComponent } from 'src/app/components/image-modal/image-modal.component';
import { DataPrivacyPage } from '../data-privacy/data-privacy.page';

@Component({
    selector: 'oc-page-register',
    templateUrl: './register.page.html',
    styleUrls: ['./register.page.scss'],
    standalone: false
})
export class RegisterPage {
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
  constructor(
    private authAPIService: AuthApiService,
    private dialog: MatDialog
  ) {}
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
    return starterDecks[this.starterDeck?.value];
  }
  cardIdToUrl(cardId: number): string {
    return `${environment.url.assets}/cards/${cardId}.png`;
  }
  openImgInModal(cardId: number) {
    this.dialog.open(ImageModalComponent, {
      data: this.cardIdToUrl(cardId),
      height: '95vh',
      maxHeight: '95vh'
    });
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
