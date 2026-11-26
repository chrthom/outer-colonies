import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { IMAGE_LOADER } from '../services/asset_preloader_service';
import { GameInteractionService } from '../services/game_interaction_service';
import { SchedulerService } from '../services/scheduler_service';
import { CountdownEvent, SocketService } from '../socket_service';
import { OptionPickerComponent } from './option_picker.component';

class MockSocketService {
  readonly state$ = new Subject();
  readonly countdown$ = new Subject<CountdownEvent>();
  readonly disconnect$ = new Subject<void>();
  disableReconnection = jasmine.createSpy('disableReconnection');
  disconnect = jasmine.createSpy('disconnect');
  emitReady = jasmine.createSpy('emitReady');
  emitHandcard = jasmine.createSpy('emitHandcard');
}

describe('OptionPickerComponent', () => {
  let socket: MockSocketService;
  let interaction: GameInteractionService;

  beforeEach(async () => {
    socket = new MockSocketService();
    await TestBed.configureTestingModule({
      imports: [OptionPickerComponent],
      providers: [
        { provide: SocketService, useValue: socket },
        { provide: SchedulerService, useValue: { schedule: () => () => {} } },
        { provide: IMAGE_LOADER, useValue: async () => undefined }
      ]
    }).compileComponents();

    interaction = TestBed.inject(GameInteractionService);
  });

  it('renders options, supports selection and confirm, and emits Handcard', () => {
    interaction.openOptionPicker('hand-1', 'target-1', [101, 102, 103], 2);
    const fixture = TestBed.createComponent(OptionPickerComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const dialog = el.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(el.querySelector('#option-picker-title')?.textContent?.trim()).toBe(
      '0/2 Karten ausgewählt - zeige Seite 1/1'
    );

    const cards = Array.from(el.querySelectorAll('.option-card')) as HTMLButtonElement[];
    const confirmBtn = el.querySelector('.confirm-btn') as HTMLButtonElement;
    expect(cards.length).toBe(3);
    expect(confirmBtn.disabled).toBeTrue();

    cards[0].click();
    fixture.detectChanges();
    expect(cards[0].getAttribute('aria-pressed')).toBe('true');
    expect(confirmBtn.disabled).toBeTrue();

    cards[2].click();
    fixture.detectChanges();
    expect(confirmBtn.disabled).toBeFalse();
    expect(el.querySelector('#option-picker-title')?.textContent?.trim()).toBe(
      '2/2 Karten ausgewählt - zeige Seite 1/1'
    );

    confirmBtn.click();
    fixture.detectChanges();
    expect(socket.emitHandcard).toHaveBeenCalledWith('hand-1', 'target-1', [101, 103]);
    expect(el.querySelector('[role="dialog"]')).toBeNull();
  });

  it('paginates across pages and preserves selections across page switches', () => {
    interaction.openOptionPicker('hand-1', 'target-1', [101, 102, 103, 104], 2);
    const fixture = TestBed.createComponent(OptionPickerComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const prevBtn = el.querySelector('.page-btn.prev') as HTMLButtonElement;
    const nextBtn = el.querySelector('.page-btn.next') as HTMLButtonElement;
    expect(prevBtn.disabled).toBeTrue();
    expect(nextBtn.disabled).toBeFalse();
    expect(el.querySelectorAll('.option-card').length).toBe(3);

    (el.querySelectorAll('.option-card')[0] as HTMLButtonElement).click();
    nextBtn.click();
    fixture.detectChanges();

    expect(prevBtn.disabled).toBeFalse();
    expect(nextBtn.disabled).toBeTrue();
    expect(el.querySelectorAll('.option-card').length).toBe(1);
    expect(el.querySelector('#option-picker-title')?.textContent?.trim()).toBe(
      '1/2 Karten ausgewählt - zeige Seite 2/2'
    );

    (el.querySelectorAll('.option-card')[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    (el.querySelector('.confirm-btn') as HTMLButtonElement).click();

    expect(socket.emitHandcard).toHaveBeenCalledWith('hand-1', 'target-1', [101, 104]);
  });

  it('cancels on Escape key and Cancel button without emitting Handcard', () => {
    interaction.activeCards.hand = 'hand-1';
    interaction.openOptionPicker('hand-1', 'target-1', [101, 102], 1);
    const fixture = TestBed.createComponent(OptionPickerComponent);
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    fixture.detectChanges();

    expect(socket.emitHandcard).not.toHaveBeenCalled();
    expect(interaction.pendingOptionPicker).toBeUndefined();
    expect(interaction.activeCards.hand).toBeUndefined();

    interaction.openOptionPicker('hand-1', 'target-1', [101, 102], 1);
    fixture.detectChanges();
    ((fixture.nativeElement as HTMLElement).querySelector('.cancel-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(socket.emitHandcard).not.toHaveBeenCalled();
    expect(interaction.pendingOptionPicker).toBeUndefined();
  });

  it('focuses the dialog when opened mid-game, traps Tab navigation, and preserves focus on page boundary', () => {
    const fixture = TestBed.createComponent(OptionPickerComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeNull();

    interaction.openOptionPicker('hand-1', 'target-1', [101, 102, 103, 104], 1);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const dialog = el.querySelector('[role="dialog"]') as HTMLElement;
    const cancelBtn = el.querySelector('.cancel-btn') as HTMLButtonElement;
    const nextBtn = el.querySelector('.page-btn.next') as HTMLButtonElement;
    expect(document.activeElement).toBe(dialog);

    // Shift+Tab from dialog container wraps to the last enabled button (nextBtn on page 1 before selection)
    const shiftTab = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true });
    dialog.dispatchEvent(shiftTab);
    expect(shiftTab.defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(nextBtn);

    // Tab from the last enabled button wraps back to the first enabled button (cancelBtn)
    const forwardTab = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    dialog.dispatchEvent(forwardTab);
    expect(forwardTab.defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(cancelBtn);

    // Reaching the last page keeps focus inside the modal when nextBtn becomes disabled
    nextBtn.focus();
    nextBtn.click();
    fixture.detectChanges();
    expect(nextBtn.disabled).toBeTrue();
    expect(document.activeElement).toBe(dialog);
  });
});
