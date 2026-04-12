import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ContentBoxComponent } from '../../components/content-box/content-box.component';
import { MatSelectionList, MatListOption } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'oc-page-rules',
  templateUrl: './rules.page.html',
  styleUrls: ['./rules.page.scss'],
  imports: [ContentBoxComponent, MatSelectionList, MatListOption, MatButtonModule]
})
export class RulesPage {
  activeChapter = 'setup';
  
  chapters = [
    'setup',
    'symbols',
    'victory',
    'glossar',
    'cards',
    'hull-cards',
    'equipment-cards',
    'infrastructure-cards',
    'orb-cards',
    'tactic-cards',
    'turn-overview',
    'missions',
    'battle-overview',
    'attacks',
    'battle-end'
  ];
  
  imgUrl(imgName: string): string {
    return `${this.assetUrl}/rules/${imgName}.png`;
  }
  iconUrl(iconName: string): string {
    return `${this.assetUrl}/icons/${iconName}.png`;
  }
  previousChapter(): void {
    const currentIndex = this.currentIndex;
    if (currentIndex > 0) {
      this.activeChapter = this.chapters[currentIndex - 1];
    }
  }
  nextChapter(): void {
    const currentIndex = this.currentIndex;
    if (currentIndex < this.chapters.length - 1) {
      this.activeChapter = this.chapters[currentIndex + 1];
    }
  }
  get assetUrl(): string {
    return environment.url.assets;
  }
  get currentIndex(): number {
    return this.chapters.indexOf(this.activeChapter);
  }
}
