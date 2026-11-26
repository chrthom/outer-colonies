import { AsyncPipe } from '@angular/common';
import { Component, HostListener, OnDestroy, inject } from '@angular/core';
import { map, startWith } from 'rxjs';
import { AssetPreloaderService } from '../services/asset_preloader_service';
import { ContinueButtonViewModel, GameInteractionService } from '../services/game_interaction_service';

/**
 * Primary phase-advance / rematch button with Spacebar shortcut and prompt hover trigger.
 */
@Component({
  selector: 'app-continue-button',
  imports: [AsyncPipe],
  templateUrl: './continue_button.component.html',
  styleUrl: './continue_button.component.scss'
})
export class ContinueButtonComponent implements OnDestroy {
  private readonly interaction = inject(GameInteractionService);
  private readonly assetPreloader = inject(AssetPreloaderService);

  readonly vm$ = this.interaction.hudRefresh$.pipe(
    startWith(undefined),
    map(() => this.getViewModel())
  );

  /** Current derived view-model with resolved button image URL. */
  getViewModel(): ContinueButtonViewModel & { imageUrl: string } {
    const vm = this.interaction.getContinueButtonState();
    return {
      ...vm,
      imageUrl: this.assetPreloader.getButtonUrl(vm.buttonKey)
    };
  }

  /** Dispatches the primary continue or rematch action when enabled. */
  onClick(): void {
    if (!this.interaction.getContinueButtonState().enabled) return;
    this.interaction.continueAction();
  }

  /** Shows or hides the hover prompt while the pointer/focus rests on this button. */
  onHover(hovered: boolean): void {
    this.interaction.setContinueHover(hovered);
  }

  ngOnDestroy(): void {
    this.interaction.setContinueHover(false);
  }

  /** Triggers the continue action on Space when no modal or other interactive control owns focus. */
  @HostListener('window:keydown', ['$event'])
  onWindowKeydown(event: KeyboardEvent): void {
    if (event.code !== 'Space' && event.key !== ' ') return;
    if (event.repeat || this.interaction.pendingOptionPicker) return;
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)
    ) {
      return;
    }
    if (!this.interaction.getContinueButtonState().enabled) return;
    event.preventDefault();
    this.onClick();
  }
}
