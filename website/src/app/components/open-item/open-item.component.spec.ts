import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OpenItemComponent } from './open-item.component';
import { MatFabButton } from '@angular/material/button';
import { environment } from 'src/environments/environment';

describe('OpenItemComponent', () => {
  let component: OpenItemComponent;
  let fixture: ComponentFixture<OpenItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatFabButton],
      declarations: []
    }).compileComponents();

    fixture = TestBed.createComponent(OpenItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate box classes correctly', () => {
    // Test with empty content
    expect(component.outerBoxClasses).toBe('');

    // Test with 3 elements
    component.content = {
      itemId: 1,
      sol: [100],
      boosters: [],
      cards: [101, 102]
    };
    expect(component.outerBoxClasses).toBe('width-3 height-1');

    // Test with 6 elements
    component.content = {
      itemId: 2,
      sol: [100, 200],
      boosters: [1, 2],
      cards: [101, 102]
    };
    expect(component.outerBoxClasses).toBe('width-3 height-2');
  });

  it('should emit done event when closeBox is called', () => {
    spyOn(component.done, 'emit');
    component.closeBox();
    expect(component.done.emit).toHaveBeenCalledWith('');
  });

  it('should have correct asset URL', () => {
    expect(component.assetURL).toBe(environment.url.assets);
  });
});