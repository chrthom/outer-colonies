import { AsyncPipe } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { map } from 'rxjs';
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
  private readonly interaction = inject(GameInteractionService);
  private readonly assetPreloader = inject(AssetPreloaderService);
  private dialogPanelEl?: HTMLElement;

  /** Focuses the dialog container as soon as it mounts into the DOM. */
  @ViewChild('dialogPanel')
  set dialogPanel(ref: ElementRef<HTMLElement> | undefined) {
    const nextEl = ref?.nativeElement;
    if (nextEl && nextEl !== this.dialogPanelEl) {
      this.dialogPanelEl = nextEl;
      nextEl.focus();
    } else if (!nextEl) {
      this.dialogPanelEl = undefined;
    }
  }

  readonly vm$ = this.interaction.pendingOptionPicker$.pipe(map(() => this.getViewModel()));

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

  /** Navigates option pages by the given delta (`-1` or `+1`) while preserving modal focus. */
  movePage(delta: number): void {
    this.interaction.moveOptionPickerPage(delta);
    const vm = this.interaction.getOptionPickerViewModel();
    if (vm && ((delta > 0 && !vm.hasNextPage) || (delta < 0 && !vm.hasPreviousPage))) {
      this.dialogPanelEl?.focus();
    }
  }

  /** Confirms the current option selection when complete. */
  confirm(): void {
    this.interaction.confirmOptionPicker();
  }

  /** Cancels the option picker modal and resets the selected hand card. */
  cancel(): void {
    this.interaction.cancelOptionPicker();
  }

  /** Traps keyboard Tab navigation inside the modal dialog. */
  onDialogKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.dialogPanelEl) return;
    const focusable = Array.from(this.dialogPanelEl.querySelectorAll<HTMLElement>('button:not(:disabled)'));
    if (focusable.length === 0) {
      event.preventDefault();
      this.dialogPanelEl.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey) {
      if (active === first || active === this.dialogPanelEl || !this.dialogPanelEl.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || !this.dialogPanelEl.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }

  /** Closes the modal when pressing Escape. */
  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (!this.interaction.pendingOptionPicker) return;
    event.preventDefault();
    this.cancel();
  }
}
