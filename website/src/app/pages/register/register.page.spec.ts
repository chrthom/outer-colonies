import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RegisterPage } from './register.page';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import AuthApiService from 'src/app/api/auth-api.service';
import { of, throwError } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { starterDecks } from '@shared/config/starter_decks';

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;
  let authApiSpy: jasmine.SpyObj<AuthApiService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    authApiSpy = jasmine.createSpyObj('AuthApiService', [
      'checkUsernameExists',
      'checkEmailExists',
      'register'
    ]);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    authApiSpy.checkUsernameExists.and.returnValue(of(false));
    authApiSpy.checkEmailExists.and.returnValue(of(false));
    authApiSpy.register.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        FormsModule,
        RouterTestingModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatCheckboxModule,
        MatCardModule,
        MatBadgeModule,
        BrowserAnimationsModule
      ],
      declarations: [],
      providers: [
        { provide: AuthApiService, useValue: authApiSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.registerForm.value).toEqual({
      username: '',
      password: '',
      email: '',
      starterDeck: '',
      dataPrivacy: false,
      newsletter: false
    });
  });

  it('should validate username field', fakeAsync(() => {
    const username = component.registerForm.get('username');
    username?.setValue('');
    expect(username?.valid).toBeFalse();

    username?.setValue('ab'); // Too short
    tick(500);
    expect(username?.valid).toBeFalse();

    username?.setValue('validusername');
    tick(500);
    expect(username?.valid).toBeTrue();
  }));

  it('should validate password field', () => {
    const password = component.registerForm.get('password');
    password?.setValue('');
    expect(password?.valid).toBeFalse();

    password?.setValue('short'); // Too short
    expect(password?.valid).toBeFalse();

    password?.setValue('validpassword123');
    expect(password?.valid).toBeTrue();
  });

  it('should validate email field', fakeAsync(() => {
    const email = component.registerForm.get('email');
    email?.setValue('');
    expect(email?.valid).toBeFalse();

    email?.setValue('invalid-email');
    tick(500);
    expect(email?.valid).toBeFalse();

    email?.setValue('valid@example.com');
    tick(500);
    expect(email?.valid).toBeTrue();
  }));

  it('should not check availability for empty or invalid values', fakeAsync(() => {
    const username = component.registerForm.get('username');
    username?.setValue('ab'); // Too short
    const email = component.registerForm.get('email');
    email?.setValue('invalid-email');

    tick(500);
    expect(authApiSpy.checkUsernameExists).not.toHaveBeenCalled();
    expect(authApiSpy.checkEmailExists).not.toHaveBeenCalled();
  }));

  it('should debounce availability checks while typing', fakeAsync(() => {
    const username = component.registerForm.get('username');
    username?.setValue('validusername');
    tick(299);
    expect(authApiSpy.checkUsernameExists).not.toHaveBeenCalled();

    tick(1);
    expect(authApiSpy.checkUsernameExists).toHaveBeenCalledTimes(1);
    expect(authApiSpy.checkUsernameExists).toHaveBeenCalledWith('validusername');
  }));

  it('should only check the latest value after rapid changes', fakeAsync(() => {
    const email = component.registerForm.get('email');
    email?.setValue('first@example.com');
    tick(200);
    email?.setValue('second@example.com');
    tick(200);
    email?.setValue('latest@example.com');
    tick(300);

    expect(authApiSpy.checkEmailExists).toHaveBeenCalledTimes(1);
    expect(authApiSpy.checkEmailExists).toHaveBeenCalledWith('latest@example.com');
  }));

  it('should treat a failed availability check as no error', fakeAsync(() => {
    authApiSpy.checkUsernameExists.and.returnValue(throwError(() => new Error('Server error')));
    const username = component.registerForm.get('username');
    username?.setValue('validusername');
    tick(300);
    expect(username?.valid).toBeTrue();
  }));

  it('should cancel the pending availability check when the component is destroyed', fakeAsync(() => {
    const username = component.registerForm.get('username');
    username?.setValue('validusername');
    fixture.destroy();
    tick(300);
    expect(authApiSpy.checkUsernameExists).not.toHaveBeenCalled();
  }));

  it('should mark the form pending during the debounce window', fakeAsync(() => {
    const username = component.registerForm.get('username');
    username?.setValue('validusername');
    expect(component.registerForm.pending).toBeTrue();
    tick(300);
    expect(component.registerForm.pending).toBeFalse();
  }));

  it('should require data privacy acceptance', () => {
    const dataPrivacy = component.registerForm.get('dataPrivacy');
    dataPrivacy?.setValue(false);
    expect(dataPrivacy?.valid).toBeFalse();

    dataPrivacy?.setValue(true);
    expect(dataPrivacy?.valid).toBeTrue();
  });

  it('should require starter deck selection', () => {
    const starterDeck = component.registerForm.get('starterDeck');
    starterDeck?.setValue('');
    expect(starterDeck?.valid).toBeFalse();

    starterDeck?.setValue('deck1');
    expect(starterDeck?.valid).toBeTrue();
  });

  it('should return an empty card list before a starter deck is selected', () => {
    expect(component.starterDeckCards).toEqual([]);
  });

  it('should return the cards of the selected starter deck', () => {
    component.starterDeck?.setValue(1);
    expect(component.starterDeckCards).toEqual(starterDecks[1]);
  });

  it('should call auth service on valid form submit', fakeAsync(() => {
    component.registerForm.setValue({
      username: 'newuser',
      password: 'password123',
      email: 'new@example.com',
      starterDeck: 1,
      dataPrivacy: true,
      newsletter: false
    });
    tick(300); // Let debounced availability checks complete

    component.submit();
    expect(authApiSpy.register).toHaveBeenCalledWith({
      username: 'newuser',
      password: 'password123',
      email: 'new@example.com',
      starterDeck: 1,
      newsletter: false
    });
  }));

  it('should not call auth service on invalid form submit', () => {
    component.registerForm.setValue({
      username: '',
      password: '',
      email: '',
      starterDeck: '',
      dataPrivacy: false,
      newsletter: false
    });

    component.submit();
    expect(authApiSpy.register).not.toHaveBeenCalled();
  });

  it('should set registrationSuccessful on successful registration', fakeAsync(() => {
    component.registerForm.setValue({
      username: 'newuser',
      password: 'password123',
      email: 'new@example.com',
      starterDeck: 'deck1',
      dataPrivacy: true,
      newsletter: false
    });
    tick(300); // Let debounced availability checks complete

    component.submit();
    expect(component.registrationSuccessful).toBeTrue();
  }));

  it('should set registrationSuccessful to false on failed registration', fakeAsync(() => {
    authApiSpy.register.and.returnValue(throwError(() => new Error('Registration failed')));
    component.registerForm.setValue({
      username: 'newuser',
      password: 'password123',
      email: 'new@example.com',
      starterDeck: 1,
      dataPrivacy: true,
      newsletter: false
    });
    tick(300); // Let debounced availability checks complete

    component.submit();
    expect(component.registrationSuccessful).toBeFalse();
  }));
});
