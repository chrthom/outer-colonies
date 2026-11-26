import ClientGameParams from '@shared/interfaces/client_game_params';
import Phaser from 'phaser';
import { Subject } from 'rxjs';
import { AssetPreloaderService } from '../services/asset_preloader_service';
import { MatchmakingService } from '../services/matchmaking_service';
import { SERVICE_REGISTRY_KEYS } from '../services/service_registry';
import { makeAddStub, makeTimeStub } from '../testing/phaser_stubs';
import Matchmaking from './matchmaking';

interface MatchmakingServiceStub {
  matchStart$: Subject<ClientGameParams>;
  start: jasmine.Spy;
  stop: jasmine.Spy;
}

describe('Matchmaking scene - service view adapter', () => {
  let matchmakingScene: Matchmaking;
  let serviceStub: MatchmakingServiceStub;
  let assetPreloaderStub: {
    preloadRequired: jasmine.Spy;
    preloadCommon: jasmine.Spy;
    registerPhaserTextures: jasmine.Spy;
  };
  let eventHandlers: Map<string, () => void>;

  beforeEach(() => {
    matchmakingScene = new Matchmaking();
    eventHandlers = new Map();
    serviceStub = {
      matchStart$: new Subject<ClientGameParams>(),
      start: jasmine.createSpy('matchmaking.start'),
      stop: jasmine.createSpy('matchmaking.stop')
    };
    assetPreloaderStub = {
      preloadRequired: jasmine.createSpy('preloadRequired').and.resolveTo(),
      preloadCommon: jasmine.createSpy('preloadCommon').and.resolveTo(),
      registerPhaserTextures: jasmine.createSpy('registerPhaserTextures')
    };

    const registryMap = new Map<string, unknown>([
      [SERVICE_REGISTRY_KEYS.matchmaking, serviceStub],
      [SERVICE_REGISTRY_KEYS.assetPreloader, assetPreloaderStub]
    ]);
    (matchmakingScene as unknown as { registry: { get: (k: string) => unknown } }).registry = {
      get: (k: string) => registryMap.get(k)
    };
    (matchmakingScene as unknown as { scene: { start: jasmine.Spy } }).scene = {
      start: jasmine.createSpy('scene.start')
    };
    (matchmakingScene as unknown as { events: { once: jasmine.Spy } }).events = {
      once: jasmine.createSpy('events.once').and.callFake((event: string, handler: () => void) => {
        eventHandlers.set(event, handler);
      })
    };
    matchmakingScene.add = makeAddStub() as unknown as Phaser.GameObjects.GameObjectFactory;
    matchmakingScene.time = makeTimeStub() as unknown as Phaser.Time.Clock;
    (matchmakingScene as unknown as { textures: object }).textures = {};

    matchmakingScene.create();
  });

  it('starts the MatchmakingService on create()', () => {
    expect(serviceStub.start).toHaveBeenCalledTimes(1);
    expect(matchmakingScene.matchmaking).toBe(serviceStub as unknown as MatchmakingService);
    expect(matchmakingScene.assetPreloader).toBe(assetPreloaderStub as unknown as AssetPreloaderService);
  });

  it('preloads required assets, registers Phaser textures, and starts common preloading', async () => {
    await assetPreloaderStub.preloadRequired.calls.mostRecent().returnValue;

    expect(assetPreloaderStub.preloadRequired).toHaveBeenCalledTimes(1);
    expect(assetPreloaderStub.registerPhaserTextures).toHaveBeenCalledTimes(1);
    expect(assetPreloaderStub.preloadCommon).toHaveBeenCalledTimes(1);
  });

  it('starts the Game scene with gameParams when matchStart$ emits', () => {
    const gameParams: ClientGameParams = { preloadCardIds: [1, 2, 3] };

    serviceStub.matchStart$.next(gameParams);

    expect(
      (matchmakingScene as unknown as { scene: { start: jasmine.Spy } }).scene.start
    ).toHaveBeenCalledWith('Game', { gameParams });
  });

  it('binds cleanup to SHUTDOWN and DESTROY and aborts background setup if destroyed mid-preload', async () => {
    expect(eventHandlers.has(Phaser.Scenes.Events.SHUTDOWN)).toBeTrue();
    expect(eventHandlers.has(Phaser.Scenes.Events.DESTROY)).toBeTrue();

    eventHandlers.get(Phaser.Scenes.Events.SHUTDOWN)!();
    eventHandlers.get(Phaser.Scenes.Events.DESTROY)!();

    expect(serviceStub.stop).toHaveBeenCalledTimes(1);
    serviceStub.matchStart$.next({ preloadCardIds: [] });
    expect(
      (matchmakingScene as unknown as { scene: { start: jasmine.Spy } }).scene.start
    ).not.toHaveBeenCalled();

    let resolvePreload!: () => void;
    assetPreloaderStub.preloadRequired.and.returnValue(
      new Promise<void>(resolve => {
        resolvePreload = resolve;
      })
    );
    assetPreloaderStub.registerPhaserTextures.calls.reset();

    matchmakingScene.create();
    (matchmakingScene as unknown as { textures: object | null }).textures = null;
    eventHandlers.get(Phaser.Scenes.Events.DESTROY)!();
    resolvePreload();
    await assetPreloaderStub.preloadRequired.calls.mostRecent().returnValue;

    expect(assetPreloaderStub.registerPhaserTextures).not.toHaveBeenCalled();
  });
});
