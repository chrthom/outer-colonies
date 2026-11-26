import { TestBed } from '@angular/core/testing';
import { BattleType, InterventionType } from '@shared/config/enums';
import { rules } from '@shared/config/rules';
import { emptyClientState } from '@shared/interfaces/client_state';
import { Subject } from 'rxjs';
import { IMAGE_LOADER } from '../services/asset_preloader_service';
import { GameSessionService } from '../services/game_session_service';
import { SchedulerService } from '../services/scheduler_service';
import { CountdownEvent, SocketService } from '../socket_service';
import { CombatRangeIndicatorComponent } from './combat_range_indicator.component';

class MockSocketService {
  readonly state$ = new Subject();
  readonly countdown$ = new Subject<CountdownEvent>();
  readonly disconnect$ = new Subject<void>();
  disableReconnection = jasmine.createSpy('disableReconnection');
  disconnect = jasmine.createSpy('disconnect');
  emitReady = jasmine.createSpy('emitReady');
}

describe('CombatRangeIndicatorComponent', () => {
  let session: GameSessionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CombatRangeIndicatorComponent],
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
  });

  afterEach(() => {
    session.stopSession();
  });

  it('shows the active combat range image and hides when out of battle or on battle round end', () => {
    session.applyState({
      ...emptyClientState,
      battle: { type: BattleType.Raid, playerShipIds: [], opponentShipIds: [], range: 2 }
    });
    const fixture = TestBed.createComponent(CombatRangeIndicatorComponent);
    fixture.detectChanges();

    const img = (fixture.nativeElement as HTMLElement).querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('alt')).toBe('Kampfreichweite 2');
    expect(img?.getAttribute('src')).toContain('utils/range2.png');

    session.applyState({
      ...emptyClientState,
      battle: { type: BattleType.Raid, playerShipIds: [], opponentShipIds: [], range: 3 },
      intervention: { type: InterventionType.BattleRoundEnd, rootType: InterventionType.BattleRoundEnd }
    });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('img')).toBeNull();

    session.applyState({
      ...emptyClientState,
      battle: { type: BattleType.Raid, playerShipIds: [], opponentShipIds: [], range: rules.maxRange + 1 }
    });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('img')).toBeNull();
  });
});
