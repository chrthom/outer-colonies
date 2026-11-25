import ClientGameParams from '@shared/interfaces/client_game_params';
import Phaser from 'phaser';
import { BehaviorSubject, Subject } from 'rxjs';
import { MatchmakingService } from '../services/matchmaking_service';
import Matchmaking from './matchmaking';

interface MatchmakingServiceStub {
  statusText$: BehaviorSubject<string>;
  onlineCount$: BehaviorSubject<number | undefined>;
  matchStart$: Subject<ClientGameParams>;
  start: jasmine.Spy;
  stop: jasmine.Spy;
}

interface MatchmakingOverrides {
  matchmaking: MatchmakingServiceStub;
  events: { once: jasmine.Spy };
  bindMatchmakingService: () => void;
  scene: { start: jasmine.Spy };
  status: { setText: jasmine.Spy };
  onlineIndicator: { setCount: jasmine.Spy };
}

describe('Matchmaking scene - service view adapter', () => {
  let matchmakingScene: Matchmaking;
  let serviceStub: MatchmakingServiceStub;
  let shutdownEvent: string;
  let shutdownHandler: () => void;

  beforeEach(() => {
    matchmakingScene = new Matchmaking();
    serviceStub = {
      statusText$: new BehaviorSubject<string>('Verbinde mit Server...'),
      onlineCount$: new BehaviorSubject<number | undefined>(undefined),
      matchStart$: new Subject<ClientGameParams>(),
      start: jasmine.createSpy('matchmaking.start'),
      stop: jasmine.createSpy('matchmaking.stop')
    };
    const handle = matchmakingScene as unknown as MatchmakingOverrides;
    handle.matchmaking = serviceStub;
    handle.status = { setText: jasmine.createSpy('status.setText') };
    handle.onlineIndicator = { setCount: jasmine.createSpy('onlineIndicator.setCount') };
    handle.scene = { start: jasmine.createSpy('scene.start') };
    handle.events = {
      once: jasmine.createSpy('events.once').and.callFake((event: string, handler: () => void) => {
        shutdownEvent = event;
        shutdownHandler = handler;
      })
    };
    handle.bindMatchmakingService();
  });

  it('starts the MatchmakingService when bound', () => {
    expect(serviceStub.start).toHaveBeenCalledTimes(1);
    expect((matchmakingScene as unknown as MatchmakingService) !== undefined).toBeTrue();
  });

  it('updates LoadingStatus text when statusText$ emits', () => {
    const handle = matchmakingScene as unknown as MatchmakingOverrides;
    serviceStub.statusText$.next('Suche Mitspieler...');

    expect(handle.status.setText).toHaveBeenCalledWith('Suche Mitspieler...');
  });

  it('forwards numeric online counts to the online indicator and ignores undefined', () => {
    const handle = matchmakingScene as unknown as MatchmakingOverrides;
    expect(handle.onlineIndicator.setCount).not.toHaveBeenCalled();

    serviceStub.onlineCount$.next(7);

    expect(handle.onlineIndicator.setCount).toHaveBeenCalledWith(7);
  });

  it('starts the Game scene with gameParams when matchStart$ emits', () => {
    const handle = matchmakingScene as unknown as MatchmakingOverrides;
    const gameParams: ClientGameParams = { preloadCardIds: [1, 2, 3] };

    serviceStub.matchStart$.next(gameParams);

    expect(handle.scene.start).toHaveBeenCalledWith('Game', { gameParams });
  });

  it('binds cleanup to SHUTDOWN and stops subscriptions and service on shutdown', () => {
    expect(shutdownEvent).toBe(Phaser.Scenes.Events.SHUTDOWN);

    shutdownHandler();

    expect(serviceStub.stop).toHaveBeenCalledTimes(1);
    const handle = matchmakingScene as unknown as MatchmakingOverrides;
    handle.status.setText.calls.reset();
    serviceStub.statusText$.next('Should not propagate');
    expect(handle.status.setText).not.toHaveBeenCalled();
  });
});
