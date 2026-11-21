import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorldPage } from './world.page';
import { RouterTestingModule } from '@angular/router/testing';

describe('WorldPage', () => {
  let component: WorldPage;
  let fixture: ComponentFixture<WorldPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorldPage, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(WorldPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the canon intro headline and paragraphs', () => {
    const element = fixture.nativeElement;
    expect(element.querySelector('h3')?.textContent).toBe('Das Sonnensystem, 2250');
    expect(element.textContent).toContain('Die Menschheit hat ihr Zuhause nie verlassen');
    expect(element.textContent).toContain('und das hier ist unsere Chronik.');
  });

  it('should distribute the four canon quotes over the page', () => {
    const quotes = fixture.nativeElement.querySelectorAll('oc-quote');
    expect(quotes.length).toBe(4);
    const attributions = Array.from<Element>(quotes).map(
      q => q.querySelector('figcaption')?.textContent ?? ''
    );
    expect(attributions.join(' ')).toContain('Samir Iyer');
    expect(attributions.join(' ')).toContain('Alexios Drakon Hellas');
    expect(attributions.join(' ')).toContain('Zubaida Kaur');
    expect(attributions.join(' ')).toContain('Aygül Demir');
  });

  it('should render the five eras of the timeline', () => {
    const headers = Array.from<Element>(fixture.nativeElement.querySelectorAll('.era-header'));
    expect(headers.length).toBe(5);
    const texts = headers.map(h => h.textContent);
    expect(texts[0]).toContain('Die Verwüstung Terras');
    expect(texts[1]).toContain('Die Besiedlung');
    expect(texts[2]).toContain('Die Brüche');
    expect(texts[3]).toContain('Der Kallisto-Krieg');
    expect(texts[4]).toContain('Heute');
  });

  it('should only use the rough canon dating markers', () => {
    const dates = Array.from<Element>(fixture.nativeElement.querySelectorAll('.era-date')).map(
      d => d.textContent
    );
    expect(dates).toEqual([
      '21.–22. Jahrhundert',
      '21.–22. Jahrhundert',
      '22. Jahrhundert',
      '≈2220er–2230er',
      '≈2250'
    ]);
  });

  it('should highlight the Kallisto war with its five phases in a warning box', () => {
    const kallisto = fixture.nativeElement.querySelector('.era-entry.kallisto');
    expect(kallisto).toBeTruthy();
    const phases = Array.from<Element>(kallisto.querySelectorAll('ol li strong')).map(p => p.textContent);
    expect(phases).toEqual([
      'Aufstand & Guerilla',
      'Eskalation',
      'Schock-Sieg',
      'Koalition der Inneren',
      'Säuberung'
    ]);
    expect(kallisto.textContent).toContain('publik und ungesühnt');
  });

  it('should render links back to the landing page at top and bottom', () => {
    const links = Array.from<Element>(
      fixture.nativeElement.querySelectorAll('.lore-back-nav a[routerLink="/"]')
    );
    expect(links.length).toBe(2);
    expect(links.every(link => link.textContent?.includes('Zurück zur Startseite'))).toBeTrue();
    expect(fixture.nativeElement.querySelector('.lore-back-nav--bottom a[routerLink="/"]')).toBeTruthy();
  });

  it('should close with a registration CTA', () => {
    const closing = fixture.nativeElement.querySelector('.history-closing');
    expect(closing.textContent).toContain('Die Chronik deiner Kolonie beginnt jetzt');
    expect(closing.querySelector('a[routerLink="/register"]')?.textContent).toContain('Jetzt mitspielen');
  });
});
