import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'oc-inventory-item',
  templateUrl: './inventory-item.component.html',
  styleUrls: ['./inventory-item.component.scss']
})
export class InventoryItemComponent {
  @Input() img = '';
  @Input() text = '';
  /** When true, renders the tile as a keyboard-focusable button control. */
  @Input() interactive = false;
  /** Disables interaction and signals an in-flight open request. */
  @Input() loading = false;
  /** Accessible button label announced to assistive technology when interactive. */
  @Input() actionLabel = '';
  /** Emitted when an interactive tile is clicked or activated via keyboard. */
  @Output() readonly activate = new EventEmitter<void>();

  /** Handles click/keyboard activation on interactive inventory tiles. */
  onActivate(): void {
    if (!this.interactive || this.loading) return;
    this.activate.emit();
  }
}
