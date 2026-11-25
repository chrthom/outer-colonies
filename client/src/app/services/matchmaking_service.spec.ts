import { TestBed } from '@angular/core/testing';
import { MatchmakingStatus } from '@shared/config/enums';
import ClientGameParams from '@shared/interfaces/client_game_params';
import { Subject } from 'rxjs';
import { CountdownEvent, MatchmakingEvent, SocketService } from '../socket_service';
import { MatchmakingService } from './matchmaking_service';

class MockSocketService {
  readonly connect$ = new Subject<void>();
  readonly disconnect$ = new Subject<void>();
  readonly connectError$ = new Subject<void>();
  readonly reconnectFailed$ = new Subject<void>();
  readonly matchmaking$ = new Subject<MatchmakingEvent>();
  readonly onlineCount$ = new Subject<number>();
  readonly state$ = new Subject<unknown>();
  readonly countdown$ = new Subject<CountdownEvent>();

  connect = jasmine.createSpy('connect');
  disconnect = jasmine.createSpy('disconnect');
  emitLogin = jasmine.createSpy('emitLogin');
}

describe('MatchmakingService', () => {
  let service: MatchmakingService;
  let socketService: MockSocketService;

  beforeEach(() => {
    socketService = new MockSocketService();
    TestBed.configureTestingModule({
      providers: [{ provide: SocketService, useValue: socketService }]
    });
    service = TestBed.inject(MatchmakingService);
  });

  afterEach(() => {
    service.stop();
  });

  describe('parseSessionToken', () => {
    it('extracts the token from ?token=<value>', () => {
      expect(service.parseSessionToken('?token=abc-123&foo=bar')).toBe('abc-123');
    });

    it('falls back to the legacy ?<value> query format', () => {
      expect(service.parseSessionToken('?legacy-token')).toBe('legacy-token');
    });

    it('returns an empty string for an empty query string', () => {
      expect(service.parseSessionToken('')).toBe('');
    });
  });

  describe('matchmaking flow', () => {
    it('connects and initializes status text on start()', () => {
      service.start('?token=tok-1');

      expect(socketService.connect).toHaveBeenCalledTimes(1);
      expect(service.token).toBe('tok-1');
      expect(service.statusText).toBe('Verbinde mit Server...');
      expect(service.onlineCount).toBeUndefined();
    });

    it('authenticates with the parsed token when connected', () => {
      service.start('?token=tok-1');

      socketService.connect$.next();

      expect(service.statusText).toBe('Authentifiziere Nutzer...');
      expect(socketService.emitLogin).toHaveBeenCalledWith('tok-1');
    });

    it('updates status text across search, disconnect, connect_error, and reconnect_failed', () => {
      service.start('?token=tok-1');

      socketService.matchmaking$.next({ status: MatchmakingStatus.Search, payload: 3 });
      expect(service.statusText).toBe('Suche Mitspieler...');

      socketService.disconnect$.next();
      expect(service.statusText).toBe('Verbindung verloren. Versuche erneut...');

      socketService.matchmaking$.next({ status: MatchmakingStatus.Search, payload: 1 });
      socketService.connectError$.next();
      expect(service.statusText).toBe('Verbindung verloren. Versuche erneut...');

      socketService.reconnectFailed$.next();
      expect(service.statusText).toBe('Verbindung fehlgeschlagen. Bitte Seite neu laden.');
    });

    it('emits matchStart$ with game params when MatchmakingStatus.Start arrives', () => {
      const received: ClientGameParams[] = [];
      const sub = service.matchStart$.subscribe(params => received.push(params));
      const gameParams: ClientGameParams = { preloadCardIds: [1, 2, 3] };

      service.start('?token=tok-1');
      socketService.matchmaking$.next({ status: MatchmakingStatus.Start, payload: gameParams });

      expect(received).toEqual([gameParams]);
      sub.unsubscribe();
    });

    it('publishes online count updates', () => {
      service.start('?token=tok-1');

      socketService.onlineCount$.next(14);

      expect(service.onlineCount).toBe(14);
    });
  });

  describe('lifecycle cleanup', () => {
    it('unsubscribes from socket streams on stop() without disconnecting the socket', () => {
      const received: ClientGameParams[] = [];
      const sub = service.matchStart$.subscribe(params => received.push(params));
      service.start('?token=tok-1');

      service.stop();
      socketService.connect$.next();
      socketService.onlineCount$.next(5);
      socketService.matchmaking$.next({ status: MatchmakingStatus.Start, payload: { preloadCardIds: [9] } });

      expect(socketService.emitLogin).not.toHaveBeenCalled();
      expect(service.onlineCount).toBeUndefined();
      expect(received).toEqual([]);
      expect(socketService.disconnect).not.toHaveBeenCalled();
      sub.unsubscribe();
    });

    it('stops subscriptions and disconnects the socket on cancel()', () => {
      service.start('?token=tok-1');

      service.cancel();
      socketService.connect$.next();

      expect(socketService.emitLogin).not.toHaveBeenCalled();
      expect(socketService.disconnect).toHaveBeenCalledTimes(1);
    });
  });
});
