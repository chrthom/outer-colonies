import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import AuthService from './auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ImprintPage } from './pages/imprint/imprint.page';
import { DataPrivacyPage } from './pages/data-privacy/data-privacy.page';

@Component({
  selector: 'oc-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  bgNo: number;
  constructor(
    public authService: AuthService,
    private dialog: MatDialog
  ) {
    this.bgNo = Math.floor(Math.random() * 7);
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
