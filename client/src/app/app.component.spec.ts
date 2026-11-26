import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import Phaser from 'phaser';
import { AppComponent } from './app.component';
import { GameInteractionService } from './services/game_interaction_service';
import { GameSessionService } from './services/game_session_service';
import { MatchmakingService } from './services/matchmaking_service';
import { SERVICE_REGISTRY_KEYS } from './services/service_registry';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent> | undefined;
  let phaserGameDestroyed = false;

  /**
   * Tears down the Phaser game of the current fixture: the matchmaking service's
   * socket connection is closed and the game instance is destroyed, which
   * removes its canvas element from the DOM on the next animation frame.
   * Does nothing if the fixture's game was already destroyed.
   */
  const destroyPhaserGame = (): Promise<void> | undefined => {
    const game = fixture?.componentInstance.phaserGame;
    if (!game || phaserGameDestroyed) return undefined;
    phaserGameDestroyed = true;
    TestBed.inject(MatchmakingService).cancel();
    const destroyed = new Promise<void>(resolve => game.events.once(Phaser.Core.Events.DESTROY, resolve));
    game.destroy(true);
    return destroyed;
  };

  /** Creates the app component and initializes its view, which boots the Phaser game. */
  const createApp = () => {
    fixture = TestBed.createComponent(AppComponent);
    phaserGameDestroyed = false;
    fixture.detectChanges(); // triggers ngAfterViewInit, which creates the game
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  afterEach(async () => {
    // The component boots its Phaser game once its view exists, so destroy it
    // after each run to avoid leaking canvas elements and socket listeners.
    // Await the destroy promise so the canvas is guaranteed to be removed
    // before the next spec boots a new game.
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
  });

  it('destroys the Phaser game and removes its canvas element', async () => {
    createApp();
    const destroyed = destroyPhaserGame();
    expect(destroyed).toBeDefined();
    // Phaser.Game#destroy() is asynchronous: it runs runDestroy() on the next
    // frame, which emits the destroy event and removes the canvas from the DOM.
    await destroyed;
    expect(document.querySelectorAll('canvas').length).toBe(0);
  });

  it('creates the Phaser game with the view and destroys it with the component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.phaserGame).withContext('not before the view exists').toBeUndefined();

    fixture.detectChanges(); // triggers ngAfterViewInit
    expect(app.phaserGame).toBeInstanceOf(Phaser.Game);

    const destroySpy = spyOn(app.phaserGame!, 'destroy').and.callThrough();
    fixture.destroy(); // triggers ngOnDestroy
    expect(destroySpy).toHaveBeenCalledWith(true);
    expect(app.phaserGame).toBeUndefined();
  });
});
