import { TestBed } from '@angular/core/testing';
import { GameResultType } from '@shared/config/enums';
import { rules } from '@shared/config/rules';
import { emptyClientState } from '@shared/interfaces/client_state';
import { Subject } from 'rxjs';
import { GameSessionService } from '../services/game_session_service';
import { SchedulerService } from '../services/scheduler_service';
import { CountdownEvent, SocketService } from '../socket_service';
import { ConnectionLostComponent } from './connection_lost.component';

class MockSocketService {
  readonly state$ = new Subject();
  readonly countdown$ = new Subject<CountdownEvent>();
  readonly disconnect$ = new Subject<void>();
  disableReconnection = jasmine.createSpy('disableReconnection');
  disconnect = jasmine.createSpy('disconnect');
  emitReady = jasmine.createSpy('emitReady');
}

describe('ConnectionLostComponent', () => {
  let session: GameSessionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectionLostComponent],
      providers: [
        { provide: SocketService, useValue: new MockSocketService() },
        { provide: SchedulerService, useValue: { schedule: () => () => {} } }
      ]
    }).compileComponents();

    session = TestBed.inject(GameSessionService);
  });

  afterEach(() => {
    session.stopSession();
  });

  it('shows the reload notice on mid-game disconnect and hides once a game result exists', () => {
    const fixture = TestBed.createComponent(ConnectionLostComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.connection-lost')).toBeNull();

    session.handleDisconnect();
    fixture.detectChanges();

    const banner = el.querySelector('.connection-lost');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain(`${rules.reconnectGracePeriod} Sekunden`);

    session.applyState({
      ...emptyClientState,
      gameResult: { won: false, type: GameResultType.Surrender, sol: 0 }
    });
    fixture.detectChanges();
    expect(el.querySelector('.connection-lost')).toBeNull();
  });
});
