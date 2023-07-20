import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OpenItemResponse } from '../../../../../server/src/components/shared_interfaces/rest_api';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'oc-open-item',
  templateUrl: './open-item.component.html',
  styleUrls: ['./open-item.component.scss']
})
export class OpenItemComponent {
  @Input() content?: OpenItemResponse = undefined;
  @Output() close = new EventEmitter<string>();
  readonly assetURL = environment.url.assets;
  constructor() {
    this.content = {
      itemId: 0,
      message: 'Test 12313 13 1 312 31 312 312 3',
      sol: [ 1034 ],
      cards: [ 102, 215 ],
      boosters: [ 1, 1, 1 ]
    }
  }
  get outerBoxClasses(): string {
    if (this.content) {
      const numberOfElements = this.content.sol.length + this.content.boosters.length + this.content.cards.length;
      switch(numberOfElements) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          return `width-${numberOfElements} height-1`;
        case 6:
          return 'width-3 height-2';
        case 7:
        case 8:
          return 'width-4 height-2';
        default:
          return 'width-5 height-2';
      }
    } else return '';
  }
  closeBox() {
    this.close.emit('');
  }
}
