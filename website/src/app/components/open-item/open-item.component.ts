import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ItemListResponseBox } from '../../../../../server/src/shared/interfaces/rest_api';
import { environment } from 'src/environments/environment';
import { MatFabButton } from '@angular/material/button';

@Component({
  selector: 'oc-open-item',
  templateUrl: './open-item.component.html',
  styleUrls: ['./open-item.component.scss'],
  imports: [MatFabButton]
})
export class OpenItemComponent {
  @Input() content?: ItemListResponseBox = undefined;
  @Output() done = new EventEmitter<string>();
  readonly assetURL = environment.url.assets;
  constructor() {}
  get outerBoxClasses(): string {
    if (this.content) {
      const numberOfElements =
        this.content.sol.length + this.content.boosters.length + this.content.cards.length;
      const width = numberOfElements > 5 ? Math.round(numberOfElements / 2) : numberOfElements;
      const height = numberOfElements > 5 ? 2 : 1;
      return `width-${width} height-${height}`;
    } else return '';
  }
  closeBox() {
    this.done.emit('');
  }
}
