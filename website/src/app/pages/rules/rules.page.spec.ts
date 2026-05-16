import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RulesPage } from './rules.page';
import { environment } from 'src/environments/environment';
import { RouterTestingModule } from '@angular/router/testing';

describe('RulesPage', () => {
  let component: RulesPage;
  let fixture: ComponentFixture<RulesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RulesPage, RouterTestingModule]
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

  it('should return icon font character for known icons', () => {
    const iconName = 'control';
    const result = component.iconUrl(iconName);
    // iconUrl now returns the Unicode character from the icon font
    expect(result).toBe('\uea02');
  });

  it('should return null for unknown icons', () => {
    const iconName = 'unknown-icon';
    expect(component.iconUrl(iconName)).toBeNull();
  });

  it('should return asset URL from environment', () => {
    expect(component.assetUrl).toBe(environment.url.assets);
  });

  it('should have URL generation methods', () => {
    // Test URL generation logic
    expect(component.imgUrl('test')).toContain('/rules/test.png');
    // iconUrl now returns icon font characters, not PNG URLs
    expect(component.iconUrl('test')).toBeNull();
  });
});
