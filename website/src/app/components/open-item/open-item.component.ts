import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OpenItemResponse } from '../../../../../server/src/shared/interfaces/rest_api';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'oc-open-item',
  templateUrl: './open-item.component.html',
  styleUrls: ['./open-item.component.scss']
})
export class OpenItemComponent {
  @Input() content?: OpenItemResponse = undefined;
  @Output() done = new EventEmitter<string>();
  readonly assetURL = environment.url.assets;
  constructor() {
    this.content = {
      itemId: 0,
      message: 'Test 12313 13 1 312 31 312 312 3',
      sol: [1034],
      cards: [102, 215],
      boosters: [1, 1, 1]
    };
  }
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
