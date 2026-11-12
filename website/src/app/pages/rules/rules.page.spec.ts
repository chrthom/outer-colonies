import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RulesPage } from './rules.page';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { IconService } from 'src/app/icon.service';

type QueryParams = Record<string, string>;

describe('RulesPage', () => {
  let component: RulesPage;
  let fixture: ComponentFixture<RulesPage>;
  let routeStub: { queryParams: Observable<QueryParams> };
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    localStorage.clear();
    routeStub = { queryParams: of<QueryParams>({}) };
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RulesPage],
      providers: [
        IconService,
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RulesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default active chapter', () => {
    const selectedValue = component.activeChapterList.selectedOptions.selected[0]?.value;
    expect(selectedValue).toBe('setup');
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

  it('should generate correct local screenshot URL', () => {
    expect(component.screenshotUrl('online_hand')).toBe('assets/rules/online_hand.png');
  });

  it('should return icon font character for known icons', () => {
    const iconName = 'control';
    const result = component.iconUrl(iconName);
    // iconUrl now returns the Unicode character from the icon font
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
    // Test URL generation logic
    expect(component.imgUrl('test')).toContain('/rules/test.png');
    // iconUrl now returns icon font characters, not PNG URLs
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
    const toggleButton = fixture.debugElement.query(By.css('#mode-toggle button')).nativeElement;
    expect(toggleButton.getAttribute('aria-checked')).toBe('true');
    expect(fixture.debugElement.query(By.css('#mode-toggle')).nativeElement.textContent).toContain(
      'Online-Spiel'
    );
  });

  it('should persist the mode choice and mirror it to the mode query param', () => {
    component.setMode('kartenspiel');
    expect(component.onlineMode).toBeFalse();
    expect(localStorage.getItem('oc-rules-mode')).toBe('kartenspiel');
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({ queryParams: { mode: 'kartenspiel' } })
    );
    fixture.detectChanges();
    const toggleButton = fixture.debugElement.query(By.css('#mode-toggle button')).nativeElement;
    expect(toggleButton.getAttribute('aria-checked')).toBe('false');
    expect(fixture.debugElement.query(By.css('#mode-toggle')).nativeElement.textContent).toContain(
      'Kartenspiel'
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

  it('should show the client controls in the online-game chapter only in online mode', () => {
    selectChapter('online-game');
    const text = () => fixture.debugElement.nativeElement.textContent;
    expect(text()).toContain('So steuerst du das Spiel');
    expect(text()).toContain('Deine Handkarten');
    expect(text()).toContain('Kartenstapel inspizieren');
    expect(text()).toContain('Missionen und Überfälle starten');
    expect(text()).toContain('Gefechte');
    expect(text()).toContain('Spielende und Kapitulation');
    component.setMode('kartenspiel');
    fixture.detectChanges();
    expect(text()).not.toContain('So steuerst du das Spiel');
    expect(text()).not.toContain('Kapitulation bestätigen');
    // Mode-independent online features remain visible in both modes
    expect(text()).toContain('Timer und Bedenkzeit');
    expect(text()).toContain('Sol');
  });

  it('should show inline hints in physical-rule chapters only in online mode', () => {
    selectChapter('setup');
    const text = () => fixture.debugElement.nativeElement.textContent;
    expect(text()).toContain('Deck-Manager der Website');
    component.setMode('kartenspiel');
    fixture.detectChanges();
    expect(text()).not.toContain('Deck-Manager der Website');
  });

  function selectChapter(chapter: string): void {
    component.activeChapterList.selectedOptions.select(
      component.activeChapterList.options.find(option => option.value === chapter)!
    );
    fixture.detectChanges();
  }
});
