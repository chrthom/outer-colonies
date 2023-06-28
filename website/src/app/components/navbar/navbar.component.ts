import { Component } from '@angular/core';
import { Router } from '@angular/router';
import AuthService from 'src/app/auth.service';

@Component({
  selector: 'oc-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  constructor(private router: Router, private authService: AuthService) {}
  logout() {
    this.authService.logout();
    this.router.navigate([ '/login' ]);
  }
}
