import { Component } from '@angular/core';
import AuthService from 'src/app/auth.service';

@Component({
  selector: 'oc-page-imprint',
  templateUrl: './imprint.page.html',
  styleUrls: ['./imprint.page.scss']
})
export class ImprintPage {
  constructor(public authService: AuthService) {}
}
