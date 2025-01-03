import { Component, Input } from '@angular/core';

@Component({
    selector: 'oc-content-box',
    templateUrl: './content-box.component.html',
    styleUrls: ['./content-box.component.scss']
})
export class ContentBoxComponent {
  @Input() title = '';
}
