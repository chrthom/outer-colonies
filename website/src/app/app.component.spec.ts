import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import AuthService from './auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { NavbarComponent } from './components/navbar/navbar.component';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({ template: '' })
class TestPageComponent {}

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
      imports: [
        RouterTestingModule.withRoutes([{ path: 'world', component: TestPageComponent }]),
        MatDialogModule
      ],
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

  it('should check the session once on startup', () => {
    expect(authSpy.check).toHaveBeenCalledTimes(1);
  });

  it('uses the same veiled star field and dark fallback for both login states', () => {
    const stars: HTMLElement = fixture.nativeElement.querySelector('#background-stars');
    const veil: HTMLElement = fixture.nativeElement.querySelector('#background-layer');
    const checkBackground = () => {
      expect(getComputedStyle(stars).backgroundImage).toContain('/background/stars1.jpg');
      expect(getComputedStyle(stars).backgroundColor).toBe('rgb(0, 0, 0)');
      expect(getComputedStyle(veil).opacity).toBe('0.4');
    };
    checkBackground();
    Object.assign(authSpy, { isLoggedIn: true });
    fixture.detectChanges();
    checkBackground();
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

  it('keeps legal links and concise wayfinding on the landing page', () => {
    const footer = fixture.nativeElement.querySelector('#footer');
    expect(footer).toBeTruthy();
    expect(footer.textContent).toContain('Die Welt');
    expect(footer.textContent).not.toContain('Die Mächte');
    expect(footer.textContent).not.toContain('Die Geschichte');
    expect(footer.textContent).not.toContain('Die Editionen');
    expect(footer.textContent).toContain('Impressum');
    expect(footer.textContent).toContain('Datenschutz');
    expect(footer.querySelector('#version')).toBeTruthy();
  });

  it('keeps the full lore navigation on other public and private pages', async () => {
    await TestBed.inject(Router).navigateByUrl('/world?from=landing');
    fixture.detectChanges();
    const footer = fixture.nativeElement.querySelector('#footer');
    expect(footer.textContent).toContain('Die Welt');
    expect(footer.textContent).toContain('Die Mächte');
    expect(footer.textContent).toContain('Die Geschichte');
    expect(footer.textContent).toContain('Die Editionen');
    expect(footer.textContent).toContain('Impressum');
    expect(footer.textContent).toContain('Datenschutz');
    Object.assign(authSpy, { isLoggedIn: true });
    fixture.detectChanges();
    expect(footer.textContent).toContain('Die Editionen');
  });

  it('provides landmarks and a skip link to the focusable main content', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('header oc-navbar')).toBeTruthy();
    expect(element.querySelector('main#main-content[tabindex="-1"] router-outlet')).toBeTruthy();
    expect(element.querySelector('footer#footer')).toBeTruthy();
    expect(element.querySelector('a.skip-link')?.getAttribute('href')).toBe('#main-content');
    expect(element.querySelector('[tabindex="invalid"]')).toBeNull();
    expect(element.querySelector('#version')?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(element.querySelector('#version h3, #version h4')).toBeNull();
  });

  it('scrolls and moves focus to the start of the main content when the skip link is activated', () => {
    const skip: HTMLAnchorElement = fixture.nativeElement.querySelector('.skip-link');
    const main: HTMLElement = fixture.nativeElement.querySelector('#main-content');
    const scrollSpy = spyOn(main, 'scrollIntoView');
    skip.click();
    expect(scrollSpy).toHaveBeenCalledWith({ block: 'start' });
    expect(document.activeElement).toBe(main);
  });

  it('moves focus to the main content after mobile menu navigation', () => {
    const main: HTMLElement = fixture.nativeElement.querySelector('#main-content');
    const scrollSpy = spyOn(main, 'scrollIntoView');
    fixture.debugElement.query(By.directive(NavbarComponent)).componentInstance.menuNavigation.emit();
    expect(document.activeElement).toBe(main);
    expect(scrollSpy).toHaveBeenCalledWith({ block: 'start' });
  });

  it('opens legal dialogs through semantic footer buttons', () => {
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('#footer-links button');
    expect(buttons.length).toBe(2);
    expect(Array.from(buttons).map(button => button.type)).toEqual(['button', 'button']);
    buttons[0].click();
    buttons[1].click();
    expect(dialogSpy.open).toHaveBeenCalledTimes(2);
  });
});
