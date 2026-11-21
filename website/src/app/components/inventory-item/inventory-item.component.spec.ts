import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryItemComponent } from './inventory-item.component';

describe('InventoryItemComponent', () => {
  let component: InventoryItemComponent;
  let fixture: ComponentFixture<InventoryItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryItemComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryItemComponent);
    component = fixture.componentInstance;
  });

  it('renders a non-interactive tile by default', () => {
    component.text = '100 Sol';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('button.item')).toBeNull();
    expect(fixture.nativeElement.querySelector('div.item')?.textContent).toContain('100 Sol');
  });

  it('renders a keyboard-accessible button and emits activate when interactive', () => {
    component.interactive = true;
    component.text = 'Booster';
    component.actionLabel = 'Booster-Pack Outer Colonies öffnen';
    fixture.detectChanges();

    const activateSpy = jasmine.createSpy('activate');
    component.activate.subscribe(activateSpy);

    const button: HTMLButtonElement | null = fixture.nativeElement.querySelector('button.item');
    expect(button).toBeTruthy();
    expect(button?.getAttribute('aria-label')).toBe('Booster-Pack Outer Colonies öffnen');

    button?.click();
    expect(activateSpy).toHaveBeenCalledTimes(1);
  });

  it('disables activation and shows loading text while opening', () => {
    component.interactive = true;
    component.loading = true;
    component.text = 'Booster';
    fixture.detectChanges();

    const activateSpy = jasmine.createSpy('activate');
    component.activate.subscribe(activateSpy);

    const button: HTMLButtonElement | null = fixture.nativeElement.querySelector('button.item');
    expect(button?.disabled).toBeTrue();
    expect(button?.textContent).toContain('Öffne…');

    component.onActivate();
    expect(activateSpy).not.toHaveBeenCalled();
  });
});
