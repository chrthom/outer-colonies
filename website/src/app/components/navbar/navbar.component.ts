import { Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink } from '@angular/router';
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
  @ViewChild('menuToggle') private menuToggle?: ElementRef<HTMLButtonElement>;

  menuOpen = false;

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.menuOpen = false;
      }
    });
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
