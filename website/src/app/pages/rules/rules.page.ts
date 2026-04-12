import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ContentBoxComponent } from '../../components/content-box/content-box.component';
import { MatSelectionList, MatListOption } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'oc-page-rules',
  templateUrl: './rules.page.html',
  styleUrls: ['./rules.page.scss'],
  imports: [ContentBoxComponent, MatSelectionList, MatListOption, MatButtonModule]
})
export class RulesPage implements OnInit {
  @ViewChild('activeChapter') activeChapterList!: MatSelectionList;

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

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const section = params['section'];
      if (section && this.chapters.includes(section)) {
        setTimeout(() => {
          this.activeChapterList.selectedOptions.select(
            this.activeChapterList.options.find(option => option.value === section)!
          );
        });
      }
    });
  }

  imgUrl(imgName: string): string {
    return `${this.assetUrl}/rules/${imgName}.png`;
  }
  iconUrl(iconName: string): string {
    return `${this.assetUrl}/icons/${iconName}.png`;
  }

  previousChapter(): void {
    const currentIndex = this.currentIndex;
    if (currentIndex > 0) {
      const newChapter = this.chapters[currentIndex - 1];
      this.activeChapterList.selectedOptions.select(
        this.activeChapterList.options.find(option => option.value === newChapter)!
      );
      this.updateUrl(newChapter);
    }
  }

  nextChapter(): void {
    const currentIndex = this.currentIndex;
    if (currentIndex < this.chapters.length - 1) {
      const newChapter = this.chapters[currentIndex + 1];
      this.activeChapterList.selectedOptions.select(
        this.activeChapterList.options.find(option => option.value === newChapter)!
      );
      this.updateUrl(newChapter);
    }
  }

  updateUrl(chapter: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section: chapter },
      queryParamsHandling: 'merge'
    });
  }

  onChapterSelected(event: any): void {
    const selectedChapter = event.options[0].value;
    this.updateUrl(selectedChapter);
  }

  get currentIndex(): number {
    const selectedValue = this.activeChapterList?.selectedOptions?.selected[0]?.value;
    return selectedValue ? this.chapters.indexOf(selectedValue) : 0;
  }

  get assetUrl(): string {
    return environment.url.assets;
  }
}
