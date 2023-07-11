import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'oc-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  bgNo: number;
  constructor() {
    if (environment.https && window.location.protocol != "https:") {
      window.location.protocol = "https:";
      window.location.reload();
    }
    this.bgNo = Math.floor(Math.random() * 7);
  }
}
