import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'oc-page-rules',
    templateUrl: './rules.page.html',
    styleUrls: ['./rules.page.scss']
})
export class RulesPage {
  activeChapter = 'intro';
  imgUrl(imgName: string): string {
    return `${this.assetUrl}/rules/${imgName}.png`;
  }
  iconUrl(iconName: string): string {
    return `${this.assetUrl}/icons/${iconName}.png`;
  }
  get assetUrl(): string {
    return environment.url.assets;
  }
}
