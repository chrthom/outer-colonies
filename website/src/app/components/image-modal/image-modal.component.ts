import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'oc-image-modal',
    templateUrl: './image-modal.component.html',
    styleUrls: ['./image-modal.component.scss'],
    standalone: false
})
export class ImageModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: string) {}
}
