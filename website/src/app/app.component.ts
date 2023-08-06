import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import AuthService from './auth.service';

@Component({
  selector: 'oc-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  bgNo: number;
  constructor(public authService: AuthService) {
    this.bgNo = Math.floor(Math.random() * 7);
  }
  get env() {
    return environment;
  }
}
