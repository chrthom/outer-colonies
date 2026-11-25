import { TestBed } from '@angular/core/testing';
import { emptyClientState } from '@shared/interfaces/client_state';
import { Subject } from 'rxjs';
import { IMAGE_LOADER } from '../services/asset_preloader_service';
import { GameSessionService } from '../services/game_session_service';
import { SchedulerService } from '../services/scheduler_service';
import { CountdownEvent, SocketService } from '../socket_service';
import { ActionPoolComponent } from './action_pool.component';

class MockSocketService {
  readonly state$ = new Subject();
  readonly countdown$ = new Subject<CountdownEvent>();
  readonly disconnect$ = new Subject<void>();
  disableReconnection = jasmine.createSpy('disableReconnection');
  disconnect = jasmine.createSpy('disconnect');
  emitReady = jasmine.createSpy('emitReady');
}

describe('ActionPoolComponent', () => {
  let session: GameSessionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionPoolComponent],
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

  it('renders player and opponent action icons and updates when the pool changes', () => {
    session.applyState({
      ...emptyClientState,
      player: { ...emptyClientState.player, actionPool: ['military', 'science'] },
      opponent: { ...emptyClientState.opponent, actionPool: ['trade'] }
    });

    const playerFixture = TestBed.createComponent(ActionPoolComponent);
    playerFixture.componentInstance.ownedByPlayer = true;
    playerFixture.detectChanges();

    const oppFixture = TestBed.createComponent(ActionPoolComponent);
    oppFixture.componentInstance.ownedByPlayer = false;
    oppFixture.detectChanges();

    const playerIcons = (playerFixture.nativeElement as HTMLElement).querySelectorAll('.action-icon');
    expect(playerIcons.length).toBe(2);
    expect(playerIcons[0].getAttribute('title')).toBe('military');
    expect(playerIcons[1].getAttribute('title')).toBe('science');

    const oppPool = (oppFixture.nativeElement as HTMLElement).querySelector('.action-pool');
    expect(oppPool?.classList).toContain('opponent');
    expect((oppFixture.nativeElement as HTMLElement).querySelectorAll('.action-icon').length).toBe(1);

    session.applyState({
      ...emptyClientState,
      player: { ...emptyClientState.player, actionPool: [] }
    });
    playerFixture.detectChanges();
    expect((playerFixture.nativeElement as HTMLElement).querySelector('.action-pool')).toBeNull();
  });
});
