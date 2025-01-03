import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ContentBoxComponent } from '../../components/content-box/content-box.component';
import { MatSelectionList, MatListOption } from '@angular/material/list';

@Component({
  selector: 'oc-page-rules',
  templateUrl: './rules.page.html',
  styleUrls: ['./rules.page.scss'],
  imports: [ContentBoxComponent, MatSelectionList, MatListOption]
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
