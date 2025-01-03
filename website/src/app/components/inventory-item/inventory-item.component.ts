import { Component, Input } from '@angular/core';

@Component({
    selector: 'oc-inventory-item',
    templateUrl: './inventory-item.component.html',
    styleUrls: ['./inventory-item.component.scss']
})
export class InventoryItemComponent {
  @Input() img = '';
  @Input() text = '';
}
