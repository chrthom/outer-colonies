import { Component } from '@angular/core';
import AuthService from 'src/app/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'oc-page-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  constructor(public authService: AuthService) {}
  get gameUrl(): string {
    return environment.url.game;
  }
}
