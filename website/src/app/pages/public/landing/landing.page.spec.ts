import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingPage } from './landing.page';
import { RouterTestingModule } from '@angular/router/testing';
import { Meta } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { CardImageService } from '../../../card-image.service';

describe('LandingPage', () => {
  let component: LandingPage;
  let fixture: ComponentFixture<LandingPage>;
  let meta: Meta;
  let cardImageSpy: jasmine.SpyObj<CardImageService>;

  beforeEach(async () => {
    cardImageSpy = jasmine.createSpyObj('CardImageService', ['cardIdToUrl', 'openImgInModal']);
    cardImageSpy.cardIdToUrl.and.callFake(
      (cardId: number) => `${environment.url.assets}/cards/${cardId}.png`
    );

    await TestBed.configureTestingModule({
      imports: [LandingPage, RouterTestingModule],
      providers: [{ provide: CardImageService, useValue: cardImageSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPage);
    component = fixture.componentInstance;
    meta = TestBed.inject(Meta);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the hero with mission H1, subline, CTA and beta badge without duplicate hero logo', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('#hero-logo')).toBeNull();
    expect(element.querySelector('#hero-title')?.textContent).toBe('Baue deine Kolonie am Rand des Lichts');
    expect(element.querySelector('#hero-tagline')?.textContent).toContain(
      'Outer Colonies ist ein browserbasiertes Online-Sammelkartenspiel'
    );

    const registerCta = element.querySelector('#hero-ctas a[routerLink="/register"]');
    const loginCta = element.querySelector('#hero-ctas a[routerLink="/login"]');
    expect(registerCta?.textContent).toContain('Registrieren');
    expect(loginCta).toBeNull();
    const betaBadge = element.querySelector('#beta-badge') as HTMLElement | null;
    expect(betaBadge?.textContent).toBe('Offene Beta');
    expect(betaBadge ? getComputedStyle(betaBadge).cursor : '').toBe('default');
  });

  it('should render the game pitch with feature bullets and rules link', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Online-Sammelkartenspiel');
    const bullets = element.querySelectorAll('.landing-text ul li');
    expect(bullets.length).toBe(5);
    const rules = element.querySelector('oc-content-box[title="Das Spiel"] a[routerLink="/rules"]');
    expect(rules?.getAttribute('href')).toBe('/rules');
    expect(rules?.textContent).toContain('Spielregeln lesen');
  });

  it('should render all five representative card types and names as interactive buttons', () => {
    const element: HTMLElement = fixture.nativeElement;
    const buttons = Array.from(element.querySelectorAll('#card-showcase button.showcase-card'));
    expect(buttons.length).toBe(5);

    const rendered = buttons.map(button => ({
      type: button.querySelector('.showcase-card-type')?.textContent?.trim(),
      name: button.querySelector('.showcase-card-name')?.textContent?.trim()
    }));

    expect(rendered).toEqual([
      { type: 'Rumpf', name: 'Blockadebrecher' },
      { type: 'Ausrüstung', name: 'Plasmakanone' },
      { type: 'Infrastruktur', name: 'Fusionsreaktor' },
      { type: 'Himmelskörper', name: 'Ganymed' },
      { type: 'Taktik', name: 'Verräter an Bord' }
    ]);
  });

  it('should open the card image modal with metadata when a showcase card is activated', () => {
    const element: HTMLElement = fixture.nativeElement;
    const firstCard = element.querySelector(
      '#card-showcase button.showcase-card'
    ) as HTMLButtonElement | null;
    expect(firstCard).toBeTruthy();

    firstCard?.click();

    expect(cardImageSpy.openImgInModal).toHaveBeenCalledOnceWith(220, {
      title: 'Rumpf: Blockadebrecher',
      alt: 'Spielkarte Blockadebrecher (Rumpf)'
    });
  });

  it('should render a readable fallback inside the card frame when a showcase card image fails to load', () => {
    component.onCardImageError(220);
    fixture.detectChanges();

    const firstCard = fixture.nativeElement.querySelector('#card-showcase button.showcase-card');
    expect(firstCard?.querySelector('.showcase-card-image')).toBeNull();
    expect(firstCard?.querySelector('.showcase-card-fallback')?.textContent).toContain('Blockadebrecher');
  });

  it('should link the world teaser and the three lore teasers to the lore pages', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('a[routerLink="/world"]')?.textContent).toContain('Mehr über die Welt');
    expect(element.querySelector('.teaser-card a[routerLink="/factions"]')?.textContent).toBe(
      'Mehr über die Mächte'
    );
    expect(element.querySelector('.teaser-card a[routerLink="/history"]')?.textContent).toBe(
      'Mehr zur Geschichte'
    );
    expect(element.querySelector('.teaser-card a[routerLink="/editions"]')?.textContent).toBe(
      'Mehr zu den Editionen'
    );
  });

  it('should render the closing proverb with Registrieren CTA', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Was du nicht selbst baust, gehört dir nicht.');
    const cta = element.querySelector('oc-content-box[title="Baue auf"] a[routerLink="/register"]');
    expect(cta?.textContent).toContain('Registrieren');
  });

  it('should vary surface variants across game, world, lore teasers and closing sections', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(
      element.querySelector('oc-content-box[title="Das Spiel"] .content-box')?.getAttribute('data-variant')
    ).toBe('panel');
    expect(
      element.querySelector('oc-content-box[title="Die Welt"] .content-box')?.getAttribute('data-variant')
    ).toBe('open');
    expect(
      element.querySelector('oc-content-box[title="Baue auf"] .content-box')?.getAttribute('data-variant')
    ).toBe('open');
    const teaserVariants = Array.from(
      element.querySelectorAll('#lore-teasers .teaser-card .content-box')
    ).map(el => el.getAttribute('data-variant'));
    expect(teaserVariants).toEqual(['brackets', 'brackets', 'brackets']);
  });

  it('should set meta description and Open Graph tags with the hero artwork', () => {
    expect(meta.getTag('name="description"')?.content).toContain('Online-Sammelkartenspiel');
    expect(meta.getTag('property="og:title"')?.content).toBe('Outer Colonies – Das Online-Sammelkartenspiel');
    expect(meta.getTag('property="og:description"')?.content).toContain(
      'Baue deine Kolonie am Rand des Lichts.'
    );
    expect(meta.getTag('property="og:image"')?.content).toBe(
      `${environment.url.assets}/stock_photos/rand_des_lichts.jpg`
    );
  });

  it('should remove the meta tags again on destroy', () => {
    component.ngOnDestroy();

    expect(meta.getTag('name="description"')).toBeNull();
    expect(meta.getTag('property="og:title"')).toBeNull();
    expect(meta.getTag('property="og:description"')).toBeNull();
    expect(meta.getTag('property="og:image"')).toBeNull();
  });

  it('should compose the hero background from gradient, artwork and teal star field fallback', () => {
    const background = component.heroBackground;
    expect(background).toContain('linear-gradient(to top');
    expect(background).toContain(`${environment.url.assets}/stock_photos/rand_des_lichts.jpg`);
    expect(background).toContain(`${environment.url.assets}/background/stars1.jpg`);
  });

  it('should map lore teaser names to their stock photo URLs', () => {
    expect(component.teaserUrl('maechte')).toBe(`${environment.url.assets}/stock_photos/martian_fleet.jpg`);
    expect(component.teaserUrl('geschichte')).toBe(
      `${environment.url.assets}/stock_photos/kallisto_aftermath.jpg`
    );
    expect(component.teaserUrl('editionen')).toBe(`${environment.url.assets}/stock_photos/free_traders.jpg`);
  });

  it('should fall back to a star background when a teaser artwork is missing', () => {
    const image = { src: `${environment.url.assets}/stock_photos/martian_fleet.jpg` };
    component.showPlaceholder({ target: image } as unknown as Event, 'stars1');
    expect(image.src).toBe(`${environment.url.assets}/background/stars1.jpg`);
    // A failing placeholder must not trigger an endless error loop:
    component.showPlaceholder({ target: image } as unknown as Event, 'stars1');
    expect(image.src).toBe(`${environment.url.assets}/background/stars1.jpg`);
  });
});
