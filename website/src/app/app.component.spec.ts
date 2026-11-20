import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import AuthService from './auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['check'], { displayname: '' });
    Object.assign(authSpy, { isLoggedIn: false }); // plain property, as jasmine accessors cannot be reassigned
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    authSpy.check.and.returnValue(of(false));

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, MatDialogModule],
      declarations: [],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have a random background number between 0-6', () => {
    expect(component.bgNo).toBeGreaterThanOrEqual(0);
    expect(component.bgNo).toBeLessThan(7);
  });

  it('should expose environment via env getter', () => {
    expect(component.env).toBeDefined();
    expect(component.env.stage).toBeDefined();
  });

  it('should open imprint dialog when called', () => {
    component.openImprint();
    expect(dialogSpy.open).toHaveBeenCalled();
  });

  it('should open data privacy dialog when called', () => {
    component.openDataPrivacy();
    expect(dialogSpy.open).toHaveBeenCalled();
  });

  it('should render the navbar for anonymous users', () => {
    expect(fixture.nativeElement.querySelector('oc-navbar')).toBeTruthy();
  });

  it('should render the navbar for logged-in users', () => {
    Object.assign(authSpy, { isLoggedIn: true });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('oc-navbar')).toBeTruthy();
  });

  it('should render the footer links on every page', () => {
    const footer = fixture.nativeElement.querySelector('#footer');
    expect(footer).toBeTruthy();
    expect(footer.textContent).toContain('Impressum');
    expect(footer.textContent).toContain('Datenschutz');
  });
});
