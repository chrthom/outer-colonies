import { TestBed } from '@angular/core/testing';
import { emptyClientState } from '@shared/interfaces/client_state';
import { Subject } from 'rxjs';
import { GameSessionService } from '../services/game_session_service';
import { SchedulerService } from '../services/scheduler_service';
import { CountdownEvent, SocketService } from '../socket_service';
import { CountdownIndicatorComponent } from './countdown_indicator.component';

class MockSocketService {
  readonly state$ = new Subject();
  readonly countdown$ = new Subject<CountdownEvent>();
  readonly disconnect$ = new Subject<void>();
  disableReconnection = jasmine.createSpy('disableReconnection');
  disconnect = jasmine.createSpy('disconnect');
  emitReady = jasmine.createSpy('emitReady');
}

describe('CountdownIndicatorComponent', () => {
  let socket: MockSocketService;
  let session: GameSessionService;

  beforeEach(async () => {
    socket = new MockSocketService();
    await TestBed.configureTestingModule({
      imports: [CountdownIndicatorComponent],
      providers: [
        { provide: SocketService, useValue: socket },
        { provide: SchedulerService, useValue: { schedule: () => () => {} } }
      ]
    }).compileComponents();

    session = TestBed.inject(GameSessionService);
    session.initMatch({ preloadCardIds: [] });
    session.startSession();
    session.applyState({
      ...emptyClientState,
      player: { ...emptyClientState.player, name: 'Neptune' },
      opponent: { ...emptyClientState.opponent, name: 'Triton' }
    });
  });

  afterEach(() => {
    session.stopSession();
  });

  it('shows player or opponent name without prefix when no countdown is active', () => {
    const playerFixture = TestBed.createComponent(CountdownIndicatorComponent);
    playerFixture.componentInstance.ownedByPlayer = true;
    playerFixture.detectChanges();

    const oppFixture = TestBed.createComponent(CountdownIndicatorComponent);
    oppFixture.componentInstance.ownedByPlayer = false;
    oppFixture.detectChanges();

    expect((playerFixture.nativeElement as HTMLElement).textContent?.trim()).toBe('Neptune');
    expect((oppFixture.nativeElement as HTMLElement).textContent?.trim()).toBe('Triton');
  });

  it('formats the active countdown and applies warning styling below 60 seconds', () => {
    const fixture = TestBed.createComponent(CountdownIndicatorComponent);
    fixture.componentInstance.ownedByPlayer = true;

    socket.countdown$.next({ countdown: 125, isPlayerActive: true });
    fixture.detectChanges();

    const el = (fixture.nativeElement as HTMLElement).querySelector('.countdown-indicator') as HTMLElement;
    expect(el.textContent?.trim()).toBe('[02:05]  Neptune');
    expect(el.classList).not.toContain('warning');

    socket.countdown$.next({ countdown: 42, isPlayerActive: true });
    fixture.detectChanges();

    expect(el.textContent?.trim()).toBe('[00:42]  Neptune');
    expect(el.classList).toContain('warning');

    socket.countdown$.next({ countdown: 60, isPlayerActive: true });
    fixture.detectChanges();

    expect(el.classList).not.toContain('warning');
  });
});
