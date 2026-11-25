import { AsyncPipe } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { map, tap } from 'rxjs';
import { AssetPreloaderService } from '../services/asset_preloader_service';
import { GameInteractionService, OptionPickerViewModel } from '../services/game_interaction_service';

/**
 * Accessible modal overlay for choosing required option cards when playing a card.
 */
@Component({
  selector: 'app-option-picker',
  imports: [AsyncPipe],
  templateUrl: './option_picker.component.html',
  styleUrl: './option_picker.component.scss'
})
export class OptionPickerComponent {
  @ViewChild('dialogPanel') dialogPanel?: ElementRef<HTMLElement>;

  private readonly interaction = inject(GameInteractionService);
  private readonly assetPreloader = inject(AssetPreloaderService);
  private wasOpen = false;

  readonly vm$ = this.interaction.pendingOptionPicker$.pipe(
    map(() => this.getViewModel()),
    tap(vm => {
      const isOpen = vm !== undefined;
      if (isOpen && !this.wasOpen) {
        queueMicrotask(() => this.dialogPanel?.nativeElement?.focus());
      }
      this.wasOpen = isOpen;
    })
  );

  /** Current derived option picker view-model, or `undefined` when closed. */
  getViewModel(): (OptionPickerViewModel & { cardUrls: Map<number, string> }) | undefined {
    const vm = this.interaction.getOptionPickerViewModel();
    if (!vm) return undefined;
    const cardUrls = new Map<number, string>();
    vm.visibleOptions.forEach(opt => {
      cardUrls.set(opt.cardId, this.assetPreloader.getCardImageUrl(opt.cardId));
    });
    return { ...vm, cardUrls };
  }

  /** Toggles selection of an option card by its absolute index. */
  toggleSelection(absoluteIndex: number): void {
    this.interaction.toggleOptionPickerSelection(absoluteIndex);
  }

  /** Navigates option pages by the given delta (`-1` or `+1`). */
  movePage(delta: number): void {
    this.interaction.moveOptionPickerPage(delta);
  }

  /** Confirms the current option selection when complete. */
  confirm(): void {
    this.interaction.confirmOptionPicker();
  }

  /** Cancels the option picker modal and resets the selected hand card. */
  cancel(): void {
    this.interaction.cancelOptionPicker();
  }

  /** Closes the modal when pressing Escape. */
  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (!this.interaction.pendingOptionPicker) return;
    event.preventDefault();
    this.cancel();
  }
}
