import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoryPage } from './history.page';
import { RouterTestingModule } from '@angular/router/testing';

describe('HistoryPage', () => {
  let component: HistoryPage;
  let fixture: ComponentFixture<HistoryPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryPage, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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

  it('should close with a registration CTA', () => {
    const closing = fixture.nativeElement.querySelector('.history-closing');
    expect(closing.textContent).toContain('Die Chronik deiner Kolonie beginnt jetzt');
    expect(closing.querySelector('a[routerLink="/register"]')?.textContent).toContain('Jetzt mitspielen');
  });
});
