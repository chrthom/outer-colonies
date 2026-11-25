import { TestBed } from '@angular/core/testing';
import { BattleType, GameResultType, TurnPhase } from '@shared/config/enums';
import { emptyClientState } from '@shared/interfaces/client_state';
import { Subject } from 'rxjs';
import { animationConfig } from '../config/animation';
import { IMAGE_LOADER } from '../services/asset_preloader_service';
import { GameInteractionService } from '../services/game_interaction_service';
import { GameSessionService } from '../services/game_session_service';
import { SchedulerService } from '../services/scheduler_service';
import { CountdownEvent, SocketService } from '../socket_service';
import { PromptComponent } from './prompt.component';

class FakeScheduler implements SchedulerService {
  readonly entries: Array<{ delay: number; callback: () => void; cancelled: boolean }> = [];

  schedule = (delay: number, callback: () => void): (() => void) => {
    const entry = { delay, callback, cancelled: false };
    this.entries.push(entry);
    return () => {
      entry.cancelled = true;
    };
  };

  fireAll(): void {
    while (this.entries.some(e => !e.cancelled)) {
      const entry = this.entries.shift()!;
      if (!entry.cancelled) {
        entry.callback();
      }
    }
  }
}

class MockSocketService {
  readonly state$ = new Subject();
  readonly countdown$ = new Subject<CountdownEvent>();
  readonly disconnect$ = new Subject<void>();
  disableReconnection = jasmine.createSpy('disableReconnection');
  disconnect = jasmine.createSpy('disconnect');
  emitReady = jasmine.createSpy('emitReady');
}

describe('PromptComponent', () => {
  let scheduler: FakeScheduler;
  let session: GameSessionService;
  let interaction: GameInteractionService;

  beforeEach(async () => {
    scheduler = new FakeScheduler();
    await TestBed.configureTestingModule({
      imports: [PromptComponent],
      providers: [
        { provide: SocketService, useValue: new MockSocketService() },
        { provide: SchedulerService, useValue: scheduler },
        { provide: IMAGE_LOADER, useValue: async () => undefined }
      ]
    }).compileComponents();

    session = TestBed.inject(GameSessionService);
    interaction = TestBed.inject(GameInteractionService);
  });

  afterEach(() => {
    session.stopSession();
  });

  it('auto-shows the waiting prompt with opponent phase name and auto-hides after promptShow', () => {
    const fixture = TestBed.createComponent(PromptComponent);
    session.applyState({
      ...emptyClientState,
      playerPendingAction: false,
      playerIsActive: false,
      turnPhase: TurnPhase.Build
    });
    scheduler.fireAll(); // Advance sequencer steps (note: autoHide fires too unless stepped)
    fixture.detectChanges();

    // Re-apply and step only board + hand/view before autoHide fires
    session.applyState({
      ...emptyClientState,
      playerPendingAction: false,
      playerIsActive: false,
      turnPhase: TurnPhase.Build
    });
    // Fire board step, then hand+view step (promptShow timer stays queued)
    scheduler.entries.shift()!.callback();
    scheduler.entries.shift()!.callback();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).querySelector('.prompt-text')?.textContent;
    expect(text).toBe(
      'Warte auf Gegenspieler...\nGegner: Aufbauphase (Karten ausspielen,\nMission oder Überfall planen)'
    );
    expect(
      scheduler.entries.some(e => !e.cancelled && e.delay === animationConfig.duration.promptShow)
    ).toBeTrue();

    scheduler.fireAll();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.prompt-box')).toBeNull();
  });

  it('shows combat phase text on hover and stays hidden during game over', () => {
    const fixture = TestBed.createComponent(PromptComponent);
    session.applyState({
      ...emptyClientState,
      playerPendingAction: true,
      turnPhase: TurnPhase.Combat,
      battle: { type: BattleType.Mission, playerShipIds: [], opponentShipIds: [], range: 3 }
    });
    scheduler.fireAll();
    interaction.setContinueHover(true);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.prompt-text')?.textContent).toBe(
      'Aktuelle Reichweite des Gefechts: 3\nFühre Angriffe mit deinen\nWaffensystemen durch!'
    );

    session.applyState({
      ...emptyClientState,
      gameResult: { won: true, type: GameResultType.Domination, sol: 42 }
    });
    scheduler.fireAll();
    interaction.setContinueHover(true);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.prompt-box')).toBeNull();
  });
});
