import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, inject, Output, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationCancellationCode,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
  RouterLink
} from '@angular/router';
import AuthService from 'src/app/auth.service';
import { MatTooltip } from '@angular/material/tooltip';
import { MatAnchor } from '@angular/material/button';

@Component({
  selector: 'oc-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss', './navbar-mobile.scss'],
  imports: [RouterLink, MatTooltip, MatAnchor]
})
export class NavbarComponent {
  router = inject(Router);
  private authService = inject(AuthService);
  private document = inject(DOCUMENT);
  @ViewChild('menuToggle') private menuToggle?: ElementRef<HTMLButtonElement>;
  @ViewChild('menuLinks') private menuLinks?: ElementRef<HTMLElement>;
  @Output() menuNavigation = new EventEmitter<void>();

  menuOpen = false;
  private menuNavigationId?: number;
  private menuNavigationRedirect = false;

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event instanceof NavigationStart) {
        if (this.menuOpen && this.menuHasFocus()) {
          this.menuNavigationId = event.id;
          this.menuToggle?.nativeElement.focus();
        } else if (
          this.menuNavigationRedirect &&
          this.document.activeElement === this.menuToggle?.nativeElement
        ) {
          this.menuNavigationId = event.id;
        }
        this.menuNavigationRedirect = false;
        this.menuOpen = false;
      } else if (event instanceof NavigationSkipped) {
        if (this.menuOpen && this.menuHasFocus()) {
          this.menuToggle?.nativeElement.focus();
        }
        this.menuOpen = false;
        this.menuNavigationRedirect = false;
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        if (event.id === this.menuNavigationId && event instanceof NavigationEnd) {
          if (this.document.activeElement === this.menuToggle?.nativeElement) {
            this.menuNavigation.emit();
          }
          this.menuNavigationId = undefined;
        } else if (event.id === this.menuNavigationId) {
          this.menuNavigationRedirect =
            event instanceof NavigationCancel && event.code === NavigationCancellationCode.Redirect;
          this.menuNavigationId = undefined;
        }
      }
    });
  }

  private menuHasFocus(): boolean {
    return (
      !!this.menuToggle?.nativeElement.getClientRects().length &&
      !!this.menuLinks?.nativeElement.contains(this.document.activeElement)
    );
  }

  /** Closes the mobile menu and returns keyboard focus to its toggle. */
  @HostListener('document:keydown.escape')
  closeMenuOnEscape(): void {
    if (this.menuOpen) {
      this.menuOpen = false;
      this.menuToggle?.nativeElement.focus();
    }
  }

  /** Whether a user is logged in (icon navbar) or the public links should be shown. */
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }
  get active(): string {
    return this.router.url.replace('/', '');
  }
  get username(): string | undefined {
    return this.authService.displayname;
  }
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
