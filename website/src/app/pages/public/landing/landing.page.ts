import { Component, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { MatAnchor } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { environment } from 'src/environments/environment';
import { CardImageService } from '../../../card-image.service';
import { ContentBoxComponent } from '../../../components/content-box/content-box.component';

/**
 * Representative game card rendered in the landing page card showcase.
 */
export interface ShowcaseCard {
  id: number;
  type: string;
  name: string;
}

/**
 * Public landing page for anonymous visitors (authenticated visitors are redirected to /home by the root guard).
 * Hero with mission headline and CTAs, game pitch with interactive 5-type card showcase,
 * world teaser, lore teasers and a closing CTA.
 */
@Component({
  selector: 'oc-page-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  imports: [RouterLink, MatAnchor, MatTooltip, ContentBoxComponent]
})
export class LandingPage implements OnDestroy {
  private meta = inject(Meta);
  private cardImage = inject(CardImageService);

  private readonly description =
    'Outer Colonies ist ein browserbasiertes Online-Sammelkartenspiel im Sonnensystem des 23. Jahrhunderts. ' +
    'Baue deine Kolonie am Rand des Lichts.';

  /** Verified representative cards covering all five Outer Colonies card types. */
  readonly showcaseCards: readonly ShowcaseCard[] = [
    { id: 220, type: 'Rumpf', name: 'Blockadebrecher' },
    { id: 151, type: 'Ausrüstung', name: 'Plasmakanone' },
    { id: 145, type: 'Infrastruktur', name: 'Fusionsreaktor' },
    { id: 159, type: 'Himmelskörper', name: 'Ganymed' },
    { id: 528, type: 'Taktik', name: 'Verräter an Bord' }
  ];

  private readonly failedCardImages = new Set<number>();

  private readonly teaserImages: Record<string, string> = {
    maechte: 'martian_fleet.jpg',
    geschichte: 'kallisto_aftermath.jpg',
    editionen: 'free_traders.jpg'
  };

  constructor() {
    this.meta.updateTag({ name: 'description', content: this.description });
    this.meta.updateTag({ property: 'og:title', content: 'Outer Colonies – Das Online-Sammelkartenspiel' });
    this.meta.updateTag({ property: 'og:description', content: this.description });
    this.meta.updateTag({ property: 'og:image', content: this.heroArtworkUrl });
  }

  /**
   * Removes the landing page meta tags again so they do not persist in the DOM
   * on all subsequent SPA routes.
   */
  ngOnDestroy(): void {
    this.meta.removeTag('name="description"');
    this.meta.removeTag('property="og:title"');
    this.meta.removeTag('property="og:description"');
    this.meta.removeTag('property="og:image"');
  }

  /** Hero background: dark-teal gradient veil with a soft central scrim over the hero artwork and teal star-field fallback. */
  get heroBackground(): string {
    return (
      'radial-gradient(ellipse 72% 64% at 50% 48%, rgba(0, 8, 10, 0.56) 0%, rgba(0, 8, 10, 0) 100%), ' +
      'linear-gradient(to top, rgba(0, 0, 0, 0.92) 0%, rgba(4, 20, 20, 0.72) 55%, rgba(0, 0, 0, 0.56) 100%), ' +
      `url("${this.heroArtworkUrl}"), ` +
      `url("${environment.url.assets}/background/stars1.jpg")`
    );
  }

  private get heroArtworkUrl(): string {
    return `${environment.url.assets}/stock_photos/rand_des_lichts.jpg`;
  }

  /**
   * Builds the card image URL for a representative showcase card.
   * @param cardId The card ID
   * @returns The card image asset URL
   */
  cardImageUrl(cardId: number): string {
    return this.cardImage.cardIdToUrl(cardId);
  }

  /**
   * Opens a representative showcase card in the accessible full-size image modal.
   * @param card The selected representative card
   */
  openCardModal(card: ShowcaseCard): void {
    this.cardImage.openImgInModal(card.id, {
      title: `${card.type}: ${card.name}`,
      alt: `Spielkarte ${card.name} (${card.type})`
    });
  }

  /**
   * Records a failed card thumbnail load so the tile renders its labeled fallback without collapsing.
   * @param cardId The card ID whose image failed to load
   */
  onCardImageError(cardId: number): void {
    this.failedCardImages.add(cardId);
  }

  /**
   * Returns whether a showcase card thumbnail failed to load.
   * @param cardId The card ID to check
   */
  hasCardImageError(cardId: number): boolean {
    return this.failedCardImages.has(cardId);
  }

  /**
   * URL of a lore teaser artwork hosted on the assets server.
   * @param name Teaser identifier, e.g. 'maechte', 'geschichte' or 'editionen'
   */
  teaserUrl(name: string): string {
    const file = this.teaserImages[name] ?? `teaser-${name}.jpg`;
    return `${environment.url.assets}/stock_photos/${file}`;
  }

  /**
   * Falls back to one of the star backgrounds while (or if) a teaser artwork is missing,
   * so the landing page never shows broken images.
   * @param event Error event of the teaser image element
   * @param background Star background to use as placeholder, e.g. 'stars1'
   */
  showPlaceholder(event: Event, background: string): void {
    const img = event.target as HTMLImageElement;
    const placeholder = `${environment.url.assets}/background/${background}.jpg`;
    if (img.src !== placeholder) {
      img.src = placeholder;
    }
  }
}
