import { Component } from '@angular/core';
import AuthService from 'src/app/auth.service';

@Component({
  selector: 'app-data-privacy',
  templateUrl: './data-privacy.page.html',
  styleUrls: ['./data-privacy.page.scss'],
})
export class DataPrivacyPage {
  constructor(public authService: AuthService) {}
}
