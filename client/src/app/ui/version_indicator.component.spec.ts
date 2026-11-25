import { TestBed } from '@angular/core/testing';
import { releaseName, version } from '@shared/config/version';
import { environment } from '../../environments/environment';
import { VersionIndicatorComponent } from './version_indicator.component';

describe('VersionIndicatorComponent', () => {
  const originalStage = environment.stage;

  afterEach(() => {
    environment.stage = originalStage;
  });

  it('renders the release name, version, and stage on non-production stages', async () => {
    environment.stage = 'staging';
    await TestBed.configureTestingModule({
      imports: [VersionIndicatorComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(VersionIndicatorComponent);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(`${releaseName} (v${version})`);
    expect(text).toContain('env: staging');
  });

  it('omits the stage label in production', async () => {
    environment.stage = 'production';
    await TestBed.configureTestingModule({
      imports: [VersionIndicatorComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(VersionIndicatorComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain(`${releaseName} (v${version})`);
    expect(el.querySelector('.stage-label')).toBeNull();
  });
});
