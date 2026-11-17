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

  it('should link to the history page at the bottom', () => {
    const link = fixture.nativeElement.querySelector('a[routerLink="/history"]');
    expect(link?.textContent).toContain('Die Chronik: Von der Besiedlung bis zur Säuberung von Kallisto');
  });
});
