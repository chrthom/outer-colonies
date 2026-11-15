import { Component, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { ImprintPage } from './pages/imprint/imprint.page';
import { DataPrivacyPage } from './pages/data-privacy/data-privacy.page';
import { NavbarComponent } from './components/navbar/navbar.component';
import { RouterOutlet } from '@angular/router';
import AuthService from './auth.service';

@Component({
  selector: 'oc-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [NavbarComponent, RouterOutlet]
})
export class AppComponent {
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);

  bgNo: number;
  constructor() {
    this.bgNo = Math.floor(Math.random() * 7);
    // Restore a cookie session on startup so the navbar shows the real login state even on public pages,
    // where no route guard triggers the session check.
    this.authService.check().subscribe();
  }
  get env() {
    return environment;
  }
  openImprint() {
    this.dialog.open(ImprintPage);
  }
  openDataPrivacy() {
    this.dialog.open(DataPrivacyPage);
  }
}
