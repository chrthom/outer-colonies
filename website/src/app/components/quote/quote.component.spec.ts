import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuoteComponent } from './quote.component';

describe('QuoteComponent', () => {
  let component: QuoteComponent;
  let fixture: ComponentFixture<QuoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuoteComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(QuoteComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render quote text with German quotation marks', () => {
    component.text = 'Meine Loyalität endet an der Reling. Danach wird gehandelt.';
    fixture.detectChanges();
    const blockquote = fixture.nativeElement.querySelector('blockquote');
    expect(blockquote.textContent).toContain('„Meine Loyalität endet an der Reling.');
    expect(blockquote.textContent?.trim().endsWith('“')).toBeTrue();
  });

  it('should combine author and role in the attribution line', () => {
    component.author = 'Zubaida Kaur';
    component.role = 'Freihändler-Clanmutter';
    fixture.detectChanges();
    const figcaption = fixture.nativeElement.querySelector('figcaption');
    expect(figcaption.textContent).toContain('– Zubaida Kaur, Freihändler-Clanmutter');
  });

  it('should render the author only when no role is given', () => {
    component.author = 'Samir Iyer';
    fixture.detectChanges();
    const figcaption = fixture.nativeElement.querySelector('figcaption');
    expect(figcaption.textContent).toContain('– Samir Iyer');
  });
});
