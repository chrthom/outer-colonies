import { Component, ElementRef, ViewChild, OnInit, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ContentBoxComponent } from '../../../components/content-box/content-box.component';
import { MatSelectionList, MatListOption, MatSelectionListChange } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { IconService } from '../../../icon.service';

@Component({
  selector: 'oc-page-rules',
  templateUrl: './rules.page.html',
  styleUrls: ['./rules.page.scss'],
  imports: [ContentBoxComponent, MatSelectionList, MatListOption, MatButtonModule]
})
export class RulesPage implements OnInit {
  @ViewChild('activeChapter') activeChapterList!: MatSelectionList;
  @ViewChild('activeChapter', { read: ElementRef }) private chapterListElement!: ElementRef<HTMLElement>;

  private iconService = inject(IconService);

  chapters = [
    'setup',
    'symbols',
    'victory',
    'glossar',
    'online-game',
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
        setTimeout(() => this.selectChapter(section));
      }
    });
  }

  imgUrl(imgName: string): string {
    return `${this.assetUrl}/rules/${imgName}.png`;
  }
  iconUrl(iconName: string): string | null {
    return this.iconService.getIcon(iconName);
  }

  previousChapter(): void {
    if (this.currentIndex > 0) {
      const newChapter = this.chapters[this.currentIndex - 1];
      this.selectChapter(newChapter);
      this.updateUrl(newChapter);
    }
  }

  nextChapter(): void {
    if (this.currentIndex < this.chapters.length - 1) {
      const newChapter = this.chapters[this.currentIndex + 1];
      this.selectChapter(newChapter);
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

  onChapterSelected(event: MatSelectionListChange): void {
    const selectedChapter = event.options[0]?.value;
    if (selectedChapter) {
      this.updateUrl(selectedChapter);
    }
  }

  /**
   * Selects the list option of the given chapter, if it exists.
   * @param chapter The chapter to select
   */
  private selectChapter(chapter: string): void {
    const option = this.activeChapterList.options.find(option => option.value === chapter);
    if (option) {
      this.activeChapterList.selectedOptions.select(option);
      const list = this.chapterListElement.nativeElement;
      const selected = list.querySelector<HTMLElement>(`mat-list-option[value="${chapter}"]`);
      if (selected && list.scrollHeight > list.clientHeight) {
        const listBounds = list.getBoundingClientRect();
        const optionBounds = selected.getBoundingClientRect();
        if (optionBounds.top < listBounds.top || optionBounds.bottom > listBounds.bottom) {
          list.scrollTop += (optionBounds.top + optionBounds.bottom - listBounds.top - listBounds.bottom) / 2;
        }
      }
    }
  }

  get currentIndex(): number {
    const selectedValue = this.activeChapterList?.selectedOptions?.selected[0]?.value;
    return selectedValue ? this.chapters.indexOf(selectedValue) : 0;
  }

  get assetUrl(): string {
    return environment.url.assets;
  }
}
