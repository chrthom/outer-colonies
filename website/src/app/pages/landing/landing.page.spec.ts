import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingPage } from './landing.page';
import { RouterTestingModule } from '@angular/router/testing';
import { Meta } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';

describe('LandingPage', () => {
  let component: LandingPage;
  let fixture: ComponentFixture<LandingPage>;
  let meta: Meta;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPage, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPage);
    component = fixture.componentInstance;
    meta = TestBed.inject(Meta);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the hero with tagline, CTAs and beta badge', () => {
    const element = fixture.nativeElement;
    expect(element.querySelector('#hero-title')?.textContent).toBe('Outer Colonies');
    expect(element.querySelector('#hero-tagline')?.textContent).toContain(
      'Baue deine Kolonie am Rand des Lichts.'
    );
    expect(element.querySelector('#hero-ctas a[routerLink="/register"]')).toBeTruthy();
    expect(element.querySelector('#hero-ctas a[routerLink="/login"]')).toBeTruthy();
    expect(element.querySelector('#beta-badge')?.textContent).toContain('Beta');
  });

  it('should render the game pitch with feature bullets', () => {
    const element = fixture.nativeElement;
    expect(element.textContent).toContain('browserbasiertes Online-Sammelkartenspiel');
    const bullets = element.querySelectorAll('.landing-text ul li');
    expect(bullets.length).toBe(5);
  });

  it('should link the world teaser and the three lore teasers to the lore pages', () => {
    const element = fixture.nativeElement;
    expect(element.querySelector('a[routerLink="/world"]')?.textContent).toContain('Mehr über die Welt');
    expect(element.querySelector('.teaser-card a[routerLink="/factions"]')).toBeTruthy();
    expect(element.querySelector('.teaser-card a[routerLink="/history"]')).toBeTruthy();
    expect(element.querySelector('.teaser-card a[routerLink="/editions"]')).toBeTruthy();
  });

  it('should render the closing proverb with registration CTA', () => {
    const element = fixture.nativeElement;
    expect(element.textContent).toContain('Was du nicht selbst baust, gehört dir nicht.');
    const cta = element.querySelector('oc-content-box[title="Baue auf."] a[routerLink="/register"]');
    expect(cta).toBeTruthy();
  });

  it('should set meta description and Open Graph tags with the hero artwork', () => {
    expect(meta.getTag('name="description"')?.content).toContain('Online-Sammelkartenspiel');
    expect(meta.getTag('property="og:title"')?.content).toBe('Outer Colonies – Das Online-Sammelkartenspiel');
    expect(meta.getTag('property="og:description"')?.content).toContain(
      'Baue deine Kolonie am Rand des Lichts.'
    );
    expect(meta.getTag('property="og:image"')?.content).toBe(`${environment.url.assets}/website/hero.jpg`);
  });

  it('should compose the hero background from gradient, artwork and star field fallback', () => {
    const background = component.heroBackground;
    expect(background).toContain('linear-gradient(to top');
    expect(background).toContain(`${environment.url.assets}/website/hero.jpg`);
    expect(background).toContain(`${environment.url.assets}/background/stars4.jpg`);
  });

  it('should fall back to a star background when a teaser artwork is missing', () => {
    const image = { src: `${environment.url.assets}/website/teaser-maechte.jpg` };
    component.showPlaceholder({ target: image } as unknown as Event, 'stars1');
    expect(image.src).toBe(`${environment.url.assets}/background/stars1.jpg`);
    // A failing placeholder must not trigger an endless error loop:
    component.showPlaceholder({ target: image } as unknown as Event, 'stars1');
    expect(image.src).toBe(`${environment.url.assets}/background/stars1.jpg`);
  });
});
