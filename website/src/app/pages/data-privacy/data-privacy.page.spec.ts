import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataPrivacyPage } from './data-privacy.page';

describe('DataPrivacyPage', () => {
  let component: DataPrivacyPage;
  let fixture: ComponentFixture<DataPrivacyPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataPrivacyPage]
    }).compileComponents();

    fixture = TestBed.createComponent(DataPrivacyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create component successfully', () => {
    // Simple test to verify component creation
    expect(component).toBeTruthy();
  });
});