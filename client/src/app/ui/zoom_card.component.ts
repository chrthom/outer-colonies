import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { map } from 'rxjs';
import { layoutConfig } from '../config/layout';
import { AssetPreloaderService } from '../services/asset_preloader_service';
import { GameInteractionService } from '../services/game_interaction_service';

/**
 * Displays the zoomed card preview overlay near the pointer, bridged from Phaser board events.
 */
@Component({
  selector: 'app-zoom-card',
  imports: [AsyncPipe],
  templateUrl: './zoom_card.component.html',
  styleUrl: './zoom_card.component.scss'
})
export class ZoomCardComponent {
  private readonly interaction = inject(GameInteractionService);
  private readonly assetPreloader = inject(AssetPreloaderService);

  private readonly xOffsetPercent = (layoutConfig.game.ui.maxCard.xOffset / layoutConfig.scene.width) * 100;
  private readonly yOffsetPercent = (layoutConfig.game.ui.maxCard.yOffset / layoutConfig.scene.height) * 100;

  readonly vm$ = this.interaction.zoomCard$.pipe(
    map(zoom => {
      if (!zoom) return undefined;
      const rawLeft = zoom.xPercent + this.xOffsetPercent * (zoom.xPercent > 50 ? -1 : 1);
      const rawTop = zoom.yPercent + this.yOffsetPercent * (zoom.yPercent < 50 ? -1 : 1);
      return {
        cardId: zoom.cardId,
        imageUrl: this.assetPreloader.getCardImageUrl(zoom.cardId),
        leftPercent: Math.min(88, Math.max(12, rawLeft)),
        topPercent: Math.min(78, Math.max(22, rawTop))
      };
    })
  );
}
