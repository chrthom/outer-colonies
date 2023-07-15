import { Component } from '@angular/core';

@Component({
  selector: 'oc-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  bgNo: number;
  constructor() {
    this.bgNo = Math.floor(Math.random() * 7);
  }
}
