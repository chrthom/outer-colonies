import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'oc-page-rules',
  templateUrl: './rules.page.html',
  styleUrls: ['./rules.page.scss'],
})
export class RulesPage {
  activeChapter: string = 'intro';
  imgUrl(imgName: string): string {
    return `${environment.url.assets}/rules/${imgName}.png`;
  }
}
