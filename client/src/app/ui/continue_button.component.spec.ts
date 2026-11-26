import { TestBed } from '@angular/core/testing';
import { GameResultType, TurnPhase } from '@shared/config/enums';
import { emptyClientState } from '@shared/interfaces/client_state';
import { Subject } from 'rxjs';
import { IMAGE_LOADER } from '../services/asset_preloader_service';
import { GameInteractionService } from '../services/game_interaction_service';
import { GameSessionService } from '../services/game_session_service';
import { SchedulerService } from '../services/scheduler_service';
import { CountdownEvent, SocketService } from '../socket_service';
import { ContinueButtonComponent } from './continue_button.component';

class MockSocketService {
  readonly state$ = new Subject();
  readonly countdown$ = new Subject<CountdownEvent>();
  readonly disconnect$ = new Subject<void>();
  disableReconnection = jasmine.createSpy('disableReconnection');
  disconnect = jasmine.createSpy('disconnect');
  emitReady = jasmine.createSpy('emitReady');
}

describe('ContinueButtonComponent', () => {
  let socket: MockSocketService;
  let session: GameSessionService;
  let interaction: GameInteractionService;

  beforeEach(async () => {
    socket = new MockSocketService();
    await TestBed.configureTestingModule({
      imports: [ContinueButtonComponent],
      providers: [
        { provide: SocketService, useValue: socket },
        {
          provide: SchedulerService,
          useValue: { schedule: (_d: number, cb: () => void) => (cb(), () => {}) }
        },
        { provide: IMAGE_LOADER, useValue: async () => undefined }
      ]
    }).compileComponents();

    session = TestBed.inject(GameSessionService);
    interaction = TestBed.inject(GameInteractionService);
  });

  afterEach(() => {
    session.stopSession();
  });

  it('renders current continue label, marks aria-disabled while waiting, and emits Ready only when enabled', () => {
    session.applyState({
      ...emptyClientState,
      playerPendingAction: true,
      playerIsActive: true,
      turnPhase: TurnPhase.Build
    });

    const fixture = TestBed.createComponent(ContinueButtonComponent);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();
    expect(button.getAttribute('aria-disabled')).toBe('false');
    expect(button.textContent?.trim()).toBe('Zug beenden');

    button.click();
    expect(socket.emitReady).toHaveBeenCalledWith(TurnPhase.Build, jasmine.any(Object));

    socket.emitReady.calls.reset();
    session.applyState({ ...emptyClientState, playerPendingAction: false });
    fixture.detectChanges();
    expect(button.disabled).toBeFalse();
    expect(button.getAttribute('aria-disabled')).toBe('true');

    button.click();
    expect(socket.emitReady).not.toHaveBeenCalled();
  });

  it('toggles hover prompt even when disabled (e.g. retract required) and clears hover after state disables action', () => {
    let promptVisible = false;
    const promptSub = interaction.promptVisible$.subscribe(v => (promptVisible = v));

    session.applyState({
      ...emptyClientState,
      playerPendingAction: true,
      playerIsActive: true,
      turnPhase: TurnPhase.Build,
      player: { ...emptyClientState.player, hasToRetractCards: true }
    });
    const fixture = TestBed.createComponent(ContinueButtonComponent);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(promptVisible).toBeFalse();

    button.dispatchEvent(new MouseEvent('mouseenter'));
    expect(promptVisible).toBeTrue();
    button.dispatchEvent(new MouseEvent('mouseleave'));
    expect(promptVisible).toBeFalse();

    // Hover while enabled, click to submit, then move mouse away after button becomes aria-disabled
    session.applyState({
      ...emptyClientState,
      playerPendingAction: true,
      playerIsActive: true,
      turnPhase: TurnPhase.Build
    });
    fixture.detectChanges();

    button.dispatchEvent(new MouseEvent('mouseenter'));
    expect(promptVisible).toBeTrue();
    button.click();
    session.applyState({ ...emptyClientState, playerPendingAction: false });
    fixture.detectChanges();

    button.dispatchEvent(new MouseEvent('mouseleave'));
    expect(promptVisible).toBeFalse();
    promptSub.unsubscribe();
  });

  it('emits returnToMatchmaking$ when clicked after game over', () => {
    session.applyState({
      ...emptyClientState,
      gameResult: { won: true, type: GameResultType.Domination, sol: 10 }
    });
    const fixture = TestBed.createComponent(ContinueButtonComponent);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('Neuen Gegner suchen');

    let returned = 0;
    const sub = interaction.returnToMatchmaking$.subscribe(() => returned++);
    button.click();
    expect(returned).toBe(1);
    sub.unsubscribe();
  });

  it('triggers continueAction on window Spacebar when enabled and no option picker is open', () => {
    session.applyState({
      ...emptyClientState,
      playerPendingAction: true,
      playerIsActive: true,
      turnPhase: TurnPhase.Build
    });
    const fixture = TestBed.createComponent(ContinueButtonComponent);
    fixture.detectChanges();

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', cancelable: true }));
    expect(socket.emitReady).toHaveBeenCalledTimes(1);

    interaction.openOptionPicker('h1', 't1', [101], 1);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', cancelable: true }));
    expect(socket.emitReady).toHaveBeenCalledTimes(1);
  });
});
