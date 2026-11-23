import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { RulesPage } from './rules.page';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { IconService } from 'src/app/icon.service';

type QueryParams = Record<string, string>;

describe('RulesPage', () => {
  let component: RulesPage;
  let fixture: ComponentFixture<RulesPage>;
  let routeStub: { queryParams: Observable<QueryParams> };
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    localStorage.clear();
    routeStub = { queryParams: of<QueryParams>({}) };

    await TestBed.configureTestingModule({
      imports: [RulesPage],
      providers: [provideRouter([]), IconService, { provide: ActivatedRoute, useValue: routeStub }]
    }).compileComponents();

    navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(RulesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render links back to the landing page at top and bottom', () => {
    const links = Array.from<Element>(
      fixture.nativeElement.querySelectorAll('.lore-back-nav a[routerLink="/"]')
    );
    expect(links.length).toBe(2);
    expect(links.every(link => link.textContent?.includes('Zurück zur Startseite'))).toBeTrue();
    expect(fixture.nativeElement.querySelector('.lore-back-nav--bottom a[routerLink="/"]')).toBeTruthy();
  });

  it('should have default active chapter', () => {
    const selectedValue = component.activeChapterList.selectedOptions.selected[0]?.value;
    expect(selectedValue).toBe('setup');
  });

  it('labels the keyboard-operable chapter list and keeps both navigation button sets', () => {
    const list: HTMLElement = fixture.nativeElement.querySelector('mat-selection-list');
    expect(list.getAttribute('aria-label')).toBe('Kapitel der Spielregeln');
    expect(list.getAttribute('role')).toBe('listbox');
    expect(fixture.nativeElement.querySelectorAll('.nav-button').length).toBe(4);
  });

  it('updates the chapter deep link without discarding other query parameters', () => {
    component.nextChapter();
    expect(component.activeChapterList.selectedOptions.selected[0]?.value).toBe('symbols');
    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({
        queryParams: { section: 'symbols' },
        queryParamsHandling: 'merge'
      })
    );
  });

  it('scrolls the chapter list to show a selection outside its visible area', () => {
    const list: HTMLElement = fixture.nativeElement.querySelector('mat-selection-list');
    const option: HTMLElement = list.querySelector('mat-list-option[value="symbols"]')!;
    Object.defineProperty(list, 'scrollHeight', { value: 800 });
    Object.defineProperty(list, 'clientHeight', { value: 200 });
    spyOn(list, 'getBoundingClientRect').and.returnValue({ top: 0, bottom: 200 } as DOMRect);
    spyOn(option, 'getBoundingClientRect').and.returnValue({ top: 300, bottom: 348 } as DOMRect);

    component.nextChapter();

    expect(list.scrollTop).toBe(224);
  });

  it('should register every sidebar chapter in the chapters array', () => {
    const optionValues = fixture.debugElement
      .queryAll(By.css('mat-list-option'))
      .map(option => option.nativeElement.getAttribute('value'));
    expect(optionValues.length).toBeGreaterThan(0);
    optionValues.forEach(value => expect(component.chapters).toContain(value));
  });

  it('should generate correct image URL', () => {
    const imgName = 'test';
    const expectedUrl = `${environment.url.assets}/rules/${imgName}.png`;
    expect(component.imgUrl(imgName)).toBe(expectedUrl);
  });

  it('should return icon font character for known icons', () => {
    const iconName = 'control';
    const result = component.iconUrl(iconName);
    expect(result).toBe('\uea02');
  });

  it('should return null for unknown icons', () => {
    const iconName = 'unknown-icon';
    expect(component.iconUrl(iconName)).toBeNull();
  });

  it('should return asset URL from environment', () => {
    expect(component.assetUrl).toBe(environment.url.assets);
  });

  it('should have URL generation methods', () => {
    expect(component.imgUrl('test')).toContain('/rules/test.png');
    expect(component.iconUrl('test')).toBeNull();
  });

  it('should describe the mission reward instead of mission cards', () => {
    selectChapter('missions');
    const chapterText = fixture.debugElement.nativeElement.textContent;
    expect(chapterText).toContain('Missionsbelohnung');
    expect(chapterText).toContain('Eine Mission ist erfolgreich');
    expect(chapterText).toContain('legst du die oberste Karte deines Ablagestapels unter dein Deck');
    expect(chapterText).toContain('unter dein Deck und ziehst 1 Karte');
    expect(chapterText).toContain('mindestens jedoch 0');
    expect(chapterText).not.toContain('Missionskarte');
  });

  it('should halve attacks also on speed ties in the glossary', () => {
    selectChapter('glossar');
    const chapterText = fixture.debugElement.nativeElement.textContent;
    expect(chapterText).toContain('sind kleiner oder gleich der');
    expect(chapterText).not.toContain('sind kleiner als die');
  });

  it('should show a speed tie in the second damage calculation example', () => {
    selectChapter('attacks');
    const chapterText = fixture.debugElement.nativeElement.textContent;
    expect(chapterText).toContain('= 5 ≤ 5');
    expect(chapterText).not.toContain('nicht halbiert');
  });

  it('should not mention mission cards in the glossary', () => {
    selectChapter('glossar');
    expect(fixture.debugElement.nativeElement.textContent).not.toContain('Missionskarte');
  });

  it('should not mention mission cards in the turn overview', () => {
    selectChapter('turn-overview');
    expect(fixture.debugElement.nativeElement.textContent).not.toContain('Missionskarte');
  });

  it('should default to online mode', () => {
    expect(component.onlineMode).toBeTrue();
    const toggleButtons = fixture.debugElement.queryAll(By.css('#mode-toggle mat-button-toggle'));
    expect(toggleButtons.length).toBe(2);
    expect(toggleButtons[0].nativeElement.textContent).toContain('Online-Spiel');
    expect(toggleButtons[1].nativeElement.textContent).toContain('Kartenspiel');
    expect(toggleButtons[0].query(By.css('button')).nativeElement.getAttribute('aria-checked')).toBe('true');
    expect(toggleButtons[1].query(By.css('button')).nativeElement.getAttribute('aria-checked')).toBe('false');
  });

  it('should keep both mode labels visible regardless of the active mode', () => {
    component.setMode('kartenspiel');
    fixture.detectChanges();
    const toggleButtons = fixture.debugElement.queryAll(By.css('#mode-toggle mat-button-toggle'));
    expect(toggleButtons[0].nativeElement.textContent).toContain('Online-Spiel');
    expect(toggleButtons[1].nativeElement.textContent).toContain('Kartenspiel');
    expect(toggleButtons[0].query(By.css('button')).nativeElement.getAttribute('aria-checked')).toBe('false');
    expect(toggleButtons[1].query(By.css('button')).nativeElement.getAttribute('aria-checked')).toBe('true');
  });

  it('should persist the mode choice and mirror it to the mode query param', () => {
    component.setMode('kartenspiel');
    expect(component.onlineMode).toBeFalse();
    expect(localStorage.getItem('oc-rules-mode')).toBe('kartenspiel');
    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({ queryParams: { mode: 'kartenspiel' } })
    );
    fixture.detectChanges();
    const kartenspielButton = fixture.debugElement
      .queryAll(By.css('#mode-toggle mat-button-toggle'))[1]
      .query(By.css('button')).nativeElement;
    expect(kartenspielButton.getAttribute('aria-checked')).toBe('true');
  });

  it('should apply the mode from the segmented toggle change event', () => {
    component.onModeChange({ value: 'kartenspiel' } as MatButtonToggleChange);
    expect(component.onlineMode).toBeFalse();
    expect(localStorage.getItem('oc-rules-mode')).toBe('kartenspiel');
    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({ queryParams: { mode: 'kartenspiel' } })
    );
    component.onModeChange({ value: 'online' } as MatButtonToggleChange);
    expect(component.onlineMode).toBeTrue();
    expect(localStorage.getItem('oc-rules-mode')).toBe('online');
    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({ queryParams: { mode: 'online' } })
    );
  });

  it('should restore the persisted mode on init', () => {
    localStorage.setItem('oc-rules-mode', 'kartenspiel');
    const newFixture = TestBed.createComponent(RulesPage);
    newFixture.detectChanges();
    expect(newFixture.componentInstance.onlineMode).toBeFalse();
  });

  it('should let the mode query param take precedence over the stored preference', () => {
    localStorage.setItem('oc-rules-mode', 'online');
    routeStub.queryParams = of({ mode: 'kartenspiel' });
    const newFixture = TestBed.createComponent(RulesPage);
    newFixture.detectChanges();
    expect(newFixture.componentInstance.onlineMode).toBeFalse();
  });

  it('should fall back to the stored preference for an invalid mode query param', () => {
    localStorage.setItem('oc-rules-mode', 'kartenspiel');
    routeStub.queryParams = of({ mode: 'invalid' });
    const newFixture = TestBed.createComponent(RulesPage);
    newFixture.detectChanges();
    expect(newFixture.componentInstance.onlineMode).toBeFalse();
  });

  it('should redirect legacy online-game deep links to setup', async () => {
    routeStub.queryParams = of({ section: 'online-game' });
    const newFixture = TestBed.createComponent(RulesPage);
    newFixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve));
    expect(newFixture.componentInstance.activeChapterList.selectedOptions.selected[0]?.value).toBe('setup');
  });

  it('should swap the setup board diagram between online overview and tabletop setup', () => {
    selectChapter('setup');
    const text = () => fixture.debugElement.nativeElement.textContent;
    const imgs = () =>
      Array.from<HTMLImageElement>(fixture.nativeElement.querySelectorAll('img')).map(img => img.src);

    expect(text()).toContain('Deck-Manager der Website');
    expect(text()).toContain('Aufbau des Spielfelds');
    expect(imgs().some(src => src.endsWith('/rules/online_overview.png'))).toBeTrue();
    expect(imgs().some(src => src.endsWith('/rules/setup.png'))).toBeFalse();

    component.setMode('kartenspiel');
    fixture.detectChanges();
    expect(text()).not.toContain('Deck-Manager der Website');
    expect(text()).not.toContain('Aufbau des Spielfelds');
    expect(imgs().some(src => src.endsWith('/rules/online_overview.png'))).toBeFalse();
    expect(imgs().some(src => src.endsWith('/rules/setup.png'))).toBeTrue();
  });

  it('should show contextual online screenshots and hints only in online mode across chapters', () => {
    const checkChapter = (chapter: string, expectedScreenshots: string[], expectedText: string) => {
      component.setMode('online');
      selectChapter(chapter);
      const imgs = Array.from<HTMLImageElement>(fixture.nativeElement.querySelectorAll('img')).map(
        img => img.src
      );
      expectedScreenshots.forEach(name =>
        expect(imgs.some(src => src.endsWith(`/rules/${name}.png`))).toBeTrue()
      );
      expect(fixture.debugElement.nativeElement.textContent).toContain(expectedText);

      component.setMode('kartenspiel');
      fixture.detectChanges();
      expect(fixture.debugElement.queryAll(By.css('.screenshot-figure')).length).toBe(0);
      expect(fixture.debugElement.queryAll(By.css('.online-hint')).length).toBe(0);
    };

    checkChapter('victory', [], 'Kapitulation bestätigen');
    checkChapter(
      'turn-overview',
      ['online_hand', 'online_picker', 'online_stack', 'online_prompt'],
      'Bedenkzeit'
    );
    checkChapter('missions', ['online_buttons'], 'Schaltfläche Mission');
    checkChapter('battle-overview', ['online_combat'], 'Reichweitenanzeige');
  });

  function selectChapter(chapter: string): void {
    component.activeChapterList.selectedOptions.select(
      component.activeChapterList.options.find(option => option.value === chapter)!
    );
    fixture.detectChanges();
  }
});
