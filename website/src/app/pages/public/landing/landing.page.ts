import { Component, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { MatAnchor } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { environment } from 'src/environments/environment';
import { ContentBoxComponent } from '../../../components/content-box/content-box.component';

/**
 * Public landing page for anonymous visitors (authenticated visitors are redirected to /home by the root guard).
 * Hero with tagline and CTAs, game pitch, world teaser, lore teasers and a closing CTA.
 */
@Component({
  selector: 'oc-page-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  imports: [RouterLink, MatAnchor, MatTooltip, ContentBoxComponent]
})
export class LandingPage implements OnDestroy {
  private meta = inject(Meta);

  private readonly description =
    'Outer Colonies ist ein browserbasiertes Online-Sammelkartenspiel im Sonnensystem des 23. Jahrhunderts. ' +
    'Baue deine Kolonie am Rand des Lichts.';

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

  /** Hero background: gradient overlay on top of the hero artwork (star field as long as the artwork is pending). */
  get heroBackground(): string {
    return (
      'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(5, 24, 24, 0.55) 55%, rgba(0, 0, 0, 0.45) 100%), ' +
      `url("${this.heroArtworkUrl}"), ` +
      `url("${environment.url.assets}/background/stars4.jpg")`
    );
  }

  private get heroArtworkUrl(): string {
    return `${environment.url.assets}/website/hero.jpg`;
  }

  /**
   * URL of a lore teaser artwork; the final assets are human work and uploaded to the assets server.
   * @param name Teaser identifier, e.g. 'maechte', 'geschichte' or 'editionen'
   */
  teaserUrl(name: string): string {
    return `${environment.url.assets}/website/teaser-${name}.jpg`;
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
