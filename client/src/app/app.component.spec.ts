import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import Phaser from 'phaser';
import { AppComponent } from './app.component';
import Matchmaking from './scenes/matchmaking';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent> | undefined;
  let phaserGameDestroyed = false;

  /**
   * Tears down the Phaser game of the current fixture: the matchmaking scene's
   * socket connection is closed and the game instance is destroyed, which
   * removes its canvas element from the DOM on the next animation frame.
   * Does nothing if the fixture's game was already destroyed.
   */
  const destroyPhaserGame = (): Promise<void> | undefined => {
    const game = fixture?.componentInstance.phaserGame;
    if (!game || phaserGameDestroyed) return undefined;
    phaserGameDestroyed = true;
    const matchmaking = game.scene.getScene('Matchmaking') as Matchmaking | undefined;
    matchmaking?.socket?.disconnect();
    const destroyed = new Promise<void>(resolve => game.events.once(Phaser.Core.Events.DESTROY, resolve));
    game.destroy(true);
    return destroyed;
  };

  /** Creates the app component, which boots a real Phaser game. */
  const createApp = () => {
    fixture = TestBed.createComponent(AppComponent);
    phaserGameDestroyed = false;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  afterEach(async () => {
    // The component boots its Phaser game in a field initializer, so destroy
    // it after each run to avoid leaking canvas elements and socket listeners.
    // Await the destroy promise so the canvas is guaranteed to be removed
    // before the next spec boots a new game.
    await destroyPhaserGame();
    fixture = undefined;
  });

  it('should create the app', () => {
    createApp();
    expect(fixture?.componentInstance).toBeTruthy();
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
});
