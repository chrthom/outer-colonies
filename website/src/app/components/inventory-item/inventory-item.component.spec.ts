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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values for inputs', () => {
    expect(component.img).toBe('');
    expect(component.text).toBe('');
  });

  it('should accept custom img via input', () => {
    const customImg = 'test-image.png';
    component.img = customImg;
    fixture.detectChanges();
    expect(component.img).toBe(customImg);
  });

  it('should accept custom text via input', () => {
    const customText = 'Test Item';
    component.text = customText;
    fixture.detectChanges();
    expect(component.text).toBe(customText);
  });

  it('should accept and store input values', () => {
    component.img = 'test.png';
    component.text = 'Test Item';
    fixture.detectChanges();

    // Test component state instead of template rendering
    expect(component.img).toBe('test.png');
    expect(component.text).toBe('Test Item');
  });
});
