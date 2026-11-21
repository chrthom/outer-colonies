import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { EditionsPage } from './editions.page';

describe('EditionsPage', () => {
  let component: EditionsPage;
  let fixture: ComponentFixture<EditionsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditionsPage]
    }).compileComponents();

    fixture = TestBed.createComponent(EditionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render one box per edition in canonical order', () => {
    const boxes = fixture.nativeElement.querySelectorAll('oc-content-box');
    expect(boxes.length).toBe(4);
    const titles = Array.from<Element>(boxes).map(b => b.getAttribute('title'));
    expect(titles).toEqual([
      'Edition 1 – Outer Colonies',
      'Edition 2 – Jovians Freihändler',
      'Edition 3 – Marsianische Hegemonie',
      'Edition 4 – Kuiper-Gürtel'
    ]);
  });

  it('should render the confirmed story arc subtitles', () => {
    const subtitles = Array.from<Element>(fixture.nativeElement.querySelectorAll('.edition-subtitle')).map(
      s => s.textContent
    );
    expect(subtitles).toEqual([
      'Neue Heimat',
      'Der graue Markt',
      'Der Schatten des Mars',
      'Am Rand des Lichts'
    ]);
  });

  it('should render the booster pack image for each edition next to the text', () => {
    const images = Array.from<HTMLImageElement>(
      fixture.nativeElement.querySelectorAll('img.edition-booster-image')
    );
    expect(images.map(img => img.getAttribute('src'))).toEqual([
      `${environment.url.assets}/items/booster1.png`,
      `${environment.url.assets}/items/booster2.png`,
      `${environment.url.assets}/items/booster3.png`,
      `${environment.url.assets}/items/booster4.png`
    ]);
    expect(images.map(img => img.getAttribute('alt'))).toEqual([
      'Booster-Packung der Edition 1: Outer Colonies',
      'Booster-Packung der Edition 2: Jovians Freihändler',
      'Booster-Packung der Edition 3: Marsianische Hegemonie',
      'Booster-Packung der Edition 4: Kuiper-Gürtel'
    ]);
  });

  it('should render a readable fallback inside the booster frame when an image fails to load', () => {
    component.onBoosterImageError(1);
    fixture.detectChanges();

    const firstBox = fixture.nativeElement.querySelector('oc-content-box');
    expect(firstBox?.querySelector('img.edition-booster-image')).toBeNull();
    expect(firstBox?.querySelector('.edition-booster-fallback')?.textContent).toContain('Outer Colonies');
  });

  it('should render the edition stories verbatim without leaked outline prefixes', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Wir kamen mit dem, was die Trägerschiffe übrig ließen');
    expect(text).toContain('Die Legende ist teurer.');
    expect(text).toContain('Man verliert ihn nur langsamer als andere.');
    expect(text).toContain('einem Plasmabeschleuniger, der niemandem gehört.');
    expect(text).toContain('Wir haben beschlossen, das sein zu lassen. Meistens.');
    expect(text).not.toContain('Beleuchteter Weltausschnitt');
  });

  it('should not contain any edition 5 elements', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('Edition 5');
    expect(text).not.toContain('Pandora');
  });
});
