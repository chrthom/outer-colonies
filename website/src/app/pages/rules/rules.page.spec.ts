import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RulesPage } from './rules.page';
import { environment } from 'src/environments/environment';

describe('RulesPage', () => {
  let component: RulesPage;
  let fixture: ComponentFixture<RulesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RulesPage]
    }).compileComponents();

    fixture = TestBed.createComponent(RulesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default active chapter', () => {
    const selectedValue = component.activeChapterList.selectedOptions.selected[0]?.value;
    expect(selectedValue).toBe('setup');
  });

  it('should generate correct image URL', () => {
    const imgName = 'test';
    const expectedUrl = `${environment.url.assets}/rules/${imgName}.png`;
    expect(component.imgUrl(imgName)).toBe(expectedUrl);
  });

  it('should generate correct icon URL', () => {
    const iconName = 'test-icon';
    const expectedUrl = `${environment.url.assets}/icons/${iconName}.png`;
    expect(component.iconUrl(iconName)).toBe(expectedUrl);
  });

  it('should return asset URL from environment', () => {
    expect(component.assetUrl).toBe(environment.url.assets);
  });

  it('should have URL generation methods', () => {
    // Test URL generation logic instead of template rendering
    expect(component.imgUrl('test')).toContain('/rules/test.png');
    expect(component.iconUrl('test')).toContain('/icons/test.png');
  });
});
