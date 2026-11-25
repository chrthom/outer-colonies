import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import Phaser from 'phaser';
import { AppComponent } from './app.component';
import { AssetPreloaderService, IMAGE_LOADER } from './services/asset_preloader_service';
import { GameInteractionService } from './services/game_interaction_service';
import { GameSessionService } from './services/game_session_service';
import { MatchmakingService } from './services/matchmaking_service';
import { SERVICE_REGISTRY_KEYS } from './services/service_registry';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent> | undefined;
  let phaserGameDestroyed = false;

  const destroyPhaserGame = (): Promise<void> | undefined => {
    const game = fixture?.componentInstance.phaserGame;
    if (!game || phaserGameDestroyed) return undefined;
    phaserGameDestroyed = true;
    TestBed.inject(MatchmakingService).cancel();
    const destroyed = new Promise<void>(resolve => game.events.once(Phaser.Core.Events.DESTROY, resolve));
    game.destroy(true);
    return destroyed;
  };

  const createApp = () => {
    fixture = TestBed.createComponent(AppComponent);
    phaserGameDestroyed = false;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: IMAGE_LOADER, useValue: async () => undefined }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  afterEach(async () => {
    await destroyPhaserGame();
    fixture = undefined;
  });

  it('should create the app', () => {
    createApp();
    expect(fixture?.componentInstance).toBeTruthy();
  });

  it('registers Angular game services in the Phaser registry before scenes boot', () => {
    createApp();
    const registry = fixture!.componentInstance.phaserGame!.registry;

    expect(registry.get(SERVICE_REGISTRY_KEYS.matchmaking)).toBe(TestBed.inject(MatchmakingService));
    expect(registry.get(SERVICE_REGISTRY_KEYS.gameSession)).toBe(TestBed.inject(GameSessionService));
    expect(registry.get(SERVICE_REGISTRY_KEYS.gameInteraction)).toBe(TestBed.inject(GameInteractionService));
    expect(registry.get(SERVICE_REGISTRY_KEYS.assetPreloader)).toBe(TestBed.inject(AssetPreloaderService));
  });

  it('renders non-blocking overlay containers and switches between matchmaking and game HUD', () => {
    createApp();
    const el = fixture!.nativeElement as HTMLElement;
    const viewportOverlay = el.querySelector('.ui-viewport-overlay') as HTMLElement;
    const stageOverlay = el.querySelector('.ui-stage-overlay') as HTMLElement;
    expect(getComputedStyle(viewportOverlay).pointerEvents).toBe('none');
    expect(getComputedStyle(stageOverlay).pointerEvents).toBe('none');

    const matchmaking = TestBed.inject(MatchmakingService);
    const session = TestBed.inject(GameSessionService);

    matchmaking.start('?token=t1');
    fixture!.detectChanges();
    expect(el.querySelector('app-matchmaking-overlay')).not.toBeNull();
    expect(el.querySelector('app-game-hud')).toBeNull();

    matchmaking.stop();
    session.initMatch({ preloadCardIds: [] });
    fixture!.detectChanges();
    expect(el.querySelector('app-matchmaking-overlay')).toBeNull();
    expect(el.querySelector('app-game-hud')).not.toBeNull();
    expect(el.querySelector('app-option-picker')).not.toBeNull();
  });

  it('destroys the Phaser game and removes its canvas element', async () => {
    createApp();
    const destroyed = destroyPhaserGame();
    expect(destroyed).toBeDefined();
    await destroyed;
    expect(document.querySelectorAll('canvas').length).toBe(0);
  });

  it('creates the Phaser game with the view and destroys it with the component', () => {
    const localFixture = TestBed.createComponent(AppComponent);
    const app = localFixture.componentInstance;
    expect(app.phaserGame).withContext('not before the view exists').toBeUndefined();

    localFixture.detectChanges();
    expect(app.phaserGame).toBeInstanceOf(Phaser.Game);

    const destroySpy = spyOn(app.phaserGame!, 'destroy').and.callThrough();
    localFixture.destroy();
    expect(destroySpy).toHaveBeenCalledWith(true);
    expect(app.phaserGame).toBeUndefined();
  });
});
