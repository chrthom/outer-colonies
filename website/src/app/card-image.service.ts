import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ImageModalComponent, ImageModalData } from 'src/app/components/image-modal/image-modal.component';
import { environment } from 'src/environments/environment';

/**
 * Optional metadata passed to {@link CardImageService.openImgInModal} for
 * accessible dialog labeling, image alt text and modal title display.
 */
export interface CardImageModalMeta {
  title?: string;
  alt?: string;
}

/**
 * Service for building card-related asset URLs and opening card images in a modal.
 * Extracted from the deck and register pages, which previously duplicated this logic.
 */
@Injectable({
  providedIn: 'root'
})
export class CardImageService {
  private dialog = inject(MatDialog);
  private readonly assetsUrl = environment.url.assets;

  /**
   * Get the image URL of a card.
   * @param cardId The card ID
   * @returns The URL of the card image
   */
  cardIdToUrl(cardId: number): string {
    return `${this.assetsUrl}/cards/${cardId}.png`;
  }

  /**
   * Get the URL of the edition icon belonging to a card.
   * @param cardId The card ID (edition = hundreds digit)
   * @returns The URL of the edition icon
   */
  cardIdToEditionUrl(cardId: number): string {
    return `${this.assetsUrl}/icons/edition${Math.floor(cardId / 100)}.png`;
  }

  /**
   * Get the URL of the range icon for a weapon range.
   * @param range The weapon range
   * @returns The URL of the range icon
   */
  rangeToUrl(range: number): string {
    return `${this.assetsUrl}/utils/range${range}.png`;
  }

  /**
   * Open the image of a card in a modal dialog.
   * @param cardId The card ID whose image is shown
   * @param meta Optional accessible title and alt text for the dialog
   */
  openImgInModal(cardId: number, meta?: CardImageModalMeta): void {
    const src = this.cardIdToUrl(cardId);
    const data: string | ImageModalData = meta ? { src, title: meta.title, alt: meta.alt } : src;
    this.dialog.open(ImageModalComponent, {
      data,
      maxHeight: '95vh',
      restoreFocus: true,
      ...(meta ? { ariaLabel: meta.title ?? meta.alt ?? 'Kartenansicht' } : {})
    });
  }
}
