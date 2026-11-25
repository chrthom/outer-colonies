import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { MatchmakingStatus } from '@shared/config/enums';
import { MatchmakingEvent, SocketService } from '../socket_service';
import { MatchmakingService } from '../services/matchmaking_service';
import { LoadingStatusComponent } from './loading_status.component';

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

describe('LoadingStatusComponent', () => {
  let socket: MockSocketService;
  let matchmaking: MatchmakingService;

  beforeEach(async () => {
    socket = new MockSocketService();
    await TestBed.configureTestingModule({
      imports: [LoadingStatusComponent],
      providers: [{ provide: SocketService, useValue: socket }]
    }).compileComponents();
    matchmaking = TestBed.inject(MatchmakingService);
  });

  afterEach(() => {
    matchmaking.stop();
  });

  it('renders the initial status text, 12 spinner bars, and updates when statusText$ changes', () => {
    const fixture = TestBed.createComponent(LoadingStatusComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.bar').length).toBe(12);
    expect(el.querySelector('.status-text')?.textContent?.trim()).toBe('Verbinde mit Server...');

    matchmaking.start('?token=t1');
    socket.matchmaking$.next({ status: MatchmakingStatus.Search, payload: 2 });
    fixture.detectChanges();

    expect(el.querySelector('.status-text')?.textContent?.trim()).toBe('Suche Mitspieler...');
  });
});
