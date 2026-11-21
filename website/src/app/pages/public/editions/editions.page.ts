import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatAnchor } from '@angular/material/button';
import { environment } from 'src/environments/environment';
import { ContentBoxComponent } from '../../../components/content-box/content-box.component';

/**
 * Public lore page "Die Editionen": one box per released edition (Ed 1–4) with
 * story arc subtitle, illuminated section of the world, the edition story and
 * the corresponding booster pack artwork.
 */
@Component({
  selector: 'oc-page-editions',
  templateUrl: './editions.page.html',
  styleUrls: ['./editions.page.scss'],
  imports: [RouterLink, MatAnchor, ContentBoxComponent]
})
export class EditionsPage {
  private readonly failedBoosterImages = new Set<number>();

  /**
   * Builds the booster pack image URL for an edition.
   * @param editionNo The 1-based edition number
   * @returns The booster pack image asset URL
   */
  boosterImageUrl(editionNo: number): string {
    return `${environment.url.assets}/items/booster${editionNo}.png`;
  }

  /**
   * Records a failed booster image load so the frame renders its labeled fallback without collapsing.
   * @param editionNo The edition number whose booster image failed to load
   */
  onBoosterImageError(editionNo: number): void {
    this.failedBoosterImages.add(editionNo);
  }

  /**
   * Returns whether a booster pack image failed to load.
   * @param editionNo The edition number to check
   */
  hasBoosterImageError(editionNo: number): boolean {
    return this.failedBoosterImages.has(editionNo);
  }
}
