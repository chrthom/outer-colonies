import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import AuthService from 'src/app/auth.service';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
    selector: 'oc-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    imports: [RouterLink, MatTooltip]
})
export class NavbarComponent {
  constructor(
    public router: Router,
    private authService: AuthService
  ) {}
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
