import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import AuthService from 'src/app/auth.service';
import { MatTooltip } from '@angular/material/tooltip';
import { MatAnchor } from '@angular/material/button';

@Component({
  selector: 'oc-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [RouterLink, MatTooltip, MatAnchor]
})
export class NavbarComponent {
  router = inject(Router);
  private authService = inject(AuthService);

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
    this.router.navigate(['/']);
  }
}
