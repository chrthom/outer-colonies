import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RegisterPage } from './register.page';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import AuthApiService from 'src/app/api/auth-api.service';
import { of, Subject, throwError } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { starterDecks } from '@shared/config/starter_decks';
import { environment } from 'src/environments/environment';

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

    username?.setValue('ab');
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

    password?.setValue('short');
    expect(password?.valid).toBeFalse();

    password?.setValue('nodigitshere');
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

    email?.setValue('a%b@example.com');
    tick(500);
    expect(email?.valid).toBeTrue();
  }));

  it('should not check availability for empty or invalid values', fakeAsync(() => {
    const username = component.registerForm.get('username');
    username?.setValue('ab');
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

  it('should log a warning and degrade to no error when the availability check fails', fakeAsync(() => {
    environment.stage = 'development';
    try {
      const warnSpy = spyOn(console, 'warn');
      authApiSpy.checkUsernameExists.and.returnValue(throwError(() => ({ status: 500 })));
      const username = component.registerForm.get('username');
      username?.setValue('validusername');
      tick(300);
      expect(username?.valid).toBeTrue();
      expect(warnSpy).toHaveBeenCalledWith(
        jasmine.stringMatching(/status 500.*treating username as available/)
      );
    } finally {
      environment.stage = 'production';
    }
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
  it('should guard async validation and in-flight registration and allow retry', fakeAsync(() => {
    const request = new Subject<void>();
    authApiSpy.register.and.returnValue(request);
    component.registerForm.setValue({
      username: 'newuser',
      password: 'password123',
      email: 'new@example.com',
      starterDeck: 1,
      dataPrivacy: true,
      newsletter: false
    });
    component.submit();
    expect(authApiSpy.register).not.toHaveBeenCalled();
    tick(300);
    component.submit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeTrue();
    component.submit();
    expect(authApiSpy.register).toHaveBeenCalledTimes(1);
    request.error(new Error('Offline'));
    fixture.detectChanges();
    expect(component.loading).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Bitte versuche');
    authApiSpy.register.and.returnValue(of(undefined));
    component.submit();
    expect(component.registrationSuccessful).toBeTrue();
    expect(component.loading).toBeFalse();
    component.submit();
    expect(authApiSpy.register).toHaveBeenCalledTimes(2);
    tick(500);
  }));

  it('should expose input semantics and rules before validation errors', () => {
    const element = fixture.nativeElement;
    expect(element.querySelectorAll('h1').length).toBe(1);
    expect(element.querySelector('[formControlName="username"]').autocomplete).toBe('username');
    expect(element.querySelector('[formControlName="password"]').autocomplete).toBe('new-password');
    expect(element.querySelector('[formControlName="email"]').type).toBe('email');
    expect(element.querySelector('[formControlName="email"]').autocomplete).toBe('email');
    expect(element.querySelector('#username-rules').textContent).toContain('3–20');
    expect(element.querySelector('#password-rules').textContent).toContain('8–40');
    expect(element.querySelector('#password-rules').textContent).toContain('Buchstabe und eine Zahl');
  });

  it('should associate hints once and replace them with error descriptions', () => {
    const fields = [
      { name: 'username', hint: 'username-rules', control: component.username },
      { name: 'password', hint: 'password-rules', control: component.password }
    ];

    for (const field of fields) {
      const input: HTMLInputElement = fixture.nativeElement.querySelector(
        `[formControlName="${field.name}"]`
      );
      expect(input.getAttribute('aria-describedby')?.split(/\s+/)).toEqual([field.hint]);
      field.control?.markAsTouched();
      fixture.detectChanges();
      const ids = input.getAttribute('aria-describedby')?.split(/\s+/) ?? [];
      const error = input.closest('mat-form-field')?.querySelector('mat-error');
      expect(error).not.toBeNull();
      expect(ids).toEqual([error?.id ?? '']);
      expect(ids).not.toContain(field.hint);
    }
  });

  it('should open privacy outside the consent label', () => {
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.privacy-trigger');
    expect(trigger.type).toBe('button');
    expect(trigger.closest('mat-checkbox')).toBeNull();
    for (const consent of [false, true]) {
      component.dataPrivacy?.setValue(consent);
      trigger.focus();
      trigger.click();
      expect(component.dataPrivacy?.value).toBe(consent);
      expect(dialogSpy.open).toHaveBeenCalledWith(
        jasmine.any(Function),
        jasmine.objectContaining({ ariaLabel: 'Datenschutzbestimmungen' })
      );
    }
  });
});

describe('RegisterPage privacy dialog keyboard interaction', () => {
  it('should close on Escape and restore trigger focus without changing consent', fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [RegisterPage, RouterTestingModule, NoopAnimationsModule],
      providers: [
        {
          provide: AuthApiService,
          useValue: jasmine.createSpyObj('AuthApiService', [
            'register',
            'checkUsernameExists',
            'checkEmailExists'
          ])
        }
      ]
    });
    const fixture = TestBed.createComponent(RegisterPage);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.privacy-trigger');
    const dialog = TestBed.inject(MatDialog);
    for (const consent of [false, true]) {
      fixture.componentInstance.dataPrivacy?.setValue(consent);
      trigger.focus();
      trigger.click();
      fixture.detectChanges();
      tick();
      expect(dialog.openDialogs.length).toBe(1);
      expect(document.activeElement?.closest('[role="dialog"]')).not.toBeNull();
      expect(fixture.componentInstance.dataPrivacy?.value).toBe(consent);
      const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      Object.defineProperty(escape, 'keyCode', { value: 27 });
      document.activeElement?.dispatchEvent(escape);
      fixture.detectChanges();
      tick();
      expect(dialog.openDialogs.length).toBe(0);
      expect(document.activeElement).toBe(trigger);
      expect(fixture.componentInstance.dataPrivacy?.value).toBe(consent);
    }
    fixture.destroy();
    fixture.nativeElement.remove();
  }));
});
