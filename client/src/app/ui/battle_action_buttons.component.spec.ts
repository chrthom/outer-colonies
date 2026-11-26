import { TestBed } from '@angular/core/testing';
import { BattleType, TurnPhase, Zone } from '@shared/config/enums';
import { emptyClientState } from '@shared/interfaces/client_state';
import { Subject } from 'rxjs';
import { IMAGE_LOADER } from '../services/asset_preloader_service';
import { GameInteractionService } from '../services/game_interaction_service';
import { GameSessionService } from '../services/game_session_service';
import { SchedulerService } from '../services/scheduler_service';
import { CountdownEvent, SocketService } from '../socket_service';
import { BattleActionButtonsComponent } from './battle_action_buttons.component';

class MockSocketService {
  readonly state$ = new Subject();
  readonly countdown$ = new Subject<CountdownEvent>();
  readonly disconnect$ = new Subject<void>();
  disableReconnection = jasmine.createSpy('disableReconnection');
  disconnect = jasmine.createSpy('disconnect');
  emitReady = jasmine.createSpy('emitReady');
}

describe('BattleActionButtonsComponent', () => {
  let session: GameSessionService;
  let interaction: GameInteractionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BattleActionButtonsComponent],
      providers: [
        { provide: SocketService, useValue: new MockSocketService() },
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

  it('shows Mission and Überfall buttons when eligible and toggles planned battle type', () => {
    session.applyState({
      ...emptyClientState,
      playerPendingAction: true,
      playerIsActive: true,
      turnPhase: TurnPhase.Build,
      cardStacks: [
        {
          uuid: 'ship-1',
          zone: Zone.Colony,
          cards: [],
          index: 0,
          zoneCardsNum: 1,
          ownedByPlayer: true,
          missionReady: true,
          interceptionReady: false,
          attributes: []
        }
      ]
    });

    const fixture = TestBed.createComponent(BattleActionButtonsComponent);
    fixture.detectChanges();

    const missionBtn = (fixture.nativeElement as HTMLElement).querySelector('.mission') as HTMLButtonElement;
    const raidBtn = (fixture.nativeElement as HTMLElement).querySelector('.raid') as HTMLButtonElement;
    expect(missionBtn).not.toBeNull();
    expect(raidBtn).not.toBeNull();

    missionBtn.click();
    fixture.detectChanges();
    expect(interaction.plannedBattle.type).toBe(BattleType.Mission);
    expect(missionBtn.classList).toContain('active');
    expect(missionBtn.getAttribute('aria-pressed')).toBe('true');

    raidBtn.click();
    fixture.detectChanges();
    expect(interaction.plannedBattle.type).toBe(BattleType.Raid);
    expect(raidBtn.classList).toContain('active');
    expect(missionBtn.classList).not.toContain('active');
  });
});
