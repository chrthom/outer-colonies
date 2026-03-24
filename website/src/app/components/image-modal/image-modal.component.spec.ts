import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageModalComponent } from './image-modal.component';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

describe('ImageModalComponent', () => {
  let component: ImageModalComponent;
  let fixture: ComponentFixture<ImageModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageModalComponent, MatDialogModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: 'test-image-url' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ImageModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should receive data via MAT_DIALOG_DATA injection', () => {
    expect(component.data).toBe('test-image-url');
  });

  it('should store injected data', () => {
    // Test component state instead of template rendering
    expect(component.data).toBe('test-image-url');
  });
});