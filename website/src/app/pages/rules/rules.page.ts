import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ContentBoxComponent } from '../../components/content-box/content-box.component';
import { MatSelectionList, MatListOption } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggle, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router } from '@angular/router';
import { IconService } from '../../icon.service';

/** Mode of the rules: online client controls included or physical card game only. */
export type RulesMode = 'online' | 'kartenspiel';

const DEFAULT_MODE: RulesMode = 'online';
const MODE_STORAGE_KEY = 'oc-rules-mode';

@Component({
  selector: 'oc-page-rules',
  templateUrl: './rules.page.html',
  styleUrls: ['./rules.page.scss'],
  imports: [ContentBoxComponent, MatSelectionList, MatListOption, MatButtonModule, MatSlideToggle]
})
export class RulesPage implements OnInit {
  @ViewChild('activeChapter') activeChapterList!: MatSelectionList;

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

  /** Whether online usage instructions and client controls are shown (Online-Spiel mode). */
  onlineMode = true;

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
      this.onlineMode = (this.modeFromParams(params) ?? this.storedMode ?? DEFAULT_MODE) == 'online';
    });
  }

  /**
   * Handles a mode change through the slide toggle: applies the new mode, persists the choice and
   * mirrors it to the `?mode=` query param so links including the mode are shareable.
   */
  onModeChange(event: MatSlideToggleChange): void {
    this.setMode(event.checked ? 'online' : 'kartenspiel');
  }

  /** Applies a rules mode, persists it in localStorage and mirrors it to the `?mode=` query param. */
  setMode(mode: RulesMode): void {
    this.onlineMode = mode == 'online';
    localStorage.setItem(MODE_STORAGE_KEY, mode);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: mode },
      queryParamsHandling: 'merge'
    });
  }

  private modeFromParams(params: Record<string, string>): RulesMode | null {
    const mode = params['mode'];
    return mode == 'online' || mode == 'kartenspiel' ? mode : null;
  }

  private get storedMode(): RulesMode | null {
    const mode = localStorage.getItem(MODE_STORAGE_KEY);
    return mode == 'online' || mode == 'kartenspiel' ? mode : null;
  }

  /**
   * URL of an annotated client screenshot shipped with the website (placeholder until the real
   * screenshot is captured from the running client).
   */
  screenshotUrl(imgName: string): string {
    return `assets/rules/${imgName}.png`;
  }

  imgUrl(imgName: string): string {
    return `${this.assetUrl}/rules/${imgName}.png`;
  }
  iconUrl(iconName: string): string | null {
    return this.iconService.getIcon(iconName);
  }

  getIconHtml(iconName: string): string | null {
    return this.iconService.getIconHtml(iconName);
  }

  previousChapter(): void {
    if (this.currentIndex > 0) {
      const newChapter = this.chapters[this.currentIndex - 1];
      this.activeChapterList.selectedOptions.select(
        this.activeChapterList.options.find(option => option.value === newChapter)!
      );
      this.updateUrl(newChapter);
    }
  }

  nextChapter(): void {
    if (this.currentIndex < this.chapters.length - 1) {
      const newChapter = this.chapters[this.currentIndex + 1];
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
