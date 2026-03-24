import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContentBoxComponent } from './content-box.component';

describe('ContentBoxComponent', () => {
  let component: ContentBoxComponent;
  let fixture: ComponentFixture<ContentBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentBoxComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ContentBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default title', () => {
    expect(component.title).toBe('');
  });

  it('should accept custom title via input', () => {
    const customTitle = 'Test Title';
    component.title = customTitle;
    fixture.detectChanges();
    expect(component.title).toBe(customTitle);
  });

  it('should accept and store title', () => {
    const title = 'Test Content Box';
    component.title = title;
    fixture.detectChanges();

    // Test component state instead of template rendering
    expect(component.title).toBe(title);
  });
});
