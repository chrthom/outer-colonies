import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { MatchmakingEvent, SocketService } from '../socket_service';
import { MatchmakingService } from '../services/matchmaking_service';
import { OnlineIndicatorComponent } from './online_indicator.component';

class MockSocketService {
  readonly connect$ = new Subject<void>();
  readonly disconnect$ = new Subject<void>();
  readonly connectError$ = new Subject<void>();
  readonly reconnectFailed$ = new Subject<void>();
  readonly matchmaking$ = new Subject<MatchmakingEvent>();
  readonly onlineCount$ = new Subject<number>();
  connect = jasmine.createSpy('connect');
  disconnect = jasmine.createSpy('disconnect');
  emitLogin = jasmine.createSpy('emitLogin');
}

describe('OnlineIndicatorComponent', () => {
  let socket: MockSocketService;
  let matchmaking: MatchmakingService;

  beforeEach(async () => {
    socket = new MockSocketService();
    await TestBed.configureTestingModule({
      imports: [OnlineIndicatorComponent],
      providers: [{ provide: SocketService, useValue: socket }]
    }).compileComponents();
    matchmaking = TestBed.inject(MatchmakingService);
    matchmaking.start('?token=t1');
  });

  afterEach(() => {
    matchmaking.stop();
  });

  it('renders nothing before the first online count arrives', () => {
    const fixture = TestBed.createComponent(OnlineIndicatorComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.online-indicator')).toBeNull();
  });

  it('displays and updates the online player count', () => {
    const fixture = TestBed.createComponent(OnlineIndicatorComponent);
    socket.onlineCount$.next(12);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('12 Spieler online');

    socket.onlineCount$.next(3);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('3 Spieler online');
  });
});
