import Game from './game';
import { EventType, GameResultType } from '../../../../server/src/shared/config/enums';
import { ClientState, emptyClientState } from '../../../../server/src/shared/interfaces/client_state';

function makeRenderStubs() {
  // GameOverIndicator calls scene.add.image(...).setOrigin().setDepth().setAlpha()
  // and scene.add.text(...).setFontSize().setFontFamily().setColor().setDepth()
  //   .setOrigin().setAlpha() then accesses postFX.addShadow.
  // Return chainable stubs so the whole call sequence is non-throwing.
  const chainable = (): any => {
    const stub: any = {
      postFX: { addShadow: jasmine.createSpy('addShadow'), addShine: jasmine.createSpy('addShine') }
    };
    [
      'setOrigin',
      'setDepth',
      'setAlpha',
      'setFontSize',
      'setFontFamily',
      'setColor',
      'setAlign',
      'setText',
      'setVisible'
    ].forEach(method => (stub[method] = jasmine.createSpy(method).and.returnValue(stub)));
    return stub;
  };
  return {
    add: {
      image: jasmine.createSpy('image').and.callFake(chainable),
      text: jasmine.createSpy('text').and.callFake(chainable),
      particles: jasmine.createSpy('particles').and.callFake(chainable)
    },
    tweens: { add: jasmine.createSpy('tweens.add') }
  };
}

describe('Game scene - showSurrenderOnDisconnect', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
    const stubs = makeRenderStubs();
    (game as any).add = stubs.add;
    (game as any).tweens = stubs.tweens;
    game.state = emptyClientState;
  });

  it('synthesises a surrender ClientGameResult and renders the indicator', () => {
    game.showSurrenderOnDisconnect();

    expect(game.state.gameResult).toBeDefined();
    expect(game.state.gameResult?.won).toBeFalse();
    expect(game.state.gameResult?.type).toBe(GameResultType.Surrender);
    expect(game.state.gameResult?.sol).toBe(0);
    // The GameOverIndicator constructor renders three text labels and one image.
    expect((game as any).add.image as jasmine.Spy).toHaveBeenCalled();
    expect((game as any).add.text as jasmine.Spy).toHaveBeenCalled();
  });

  it('does not mutate the shared emptyClientState constant', () => {
    game.showSurrenderOnDisconnect();

    expect(emptyClientState.gameResult).toBeUndefined();
  });

  it('is a no-op when a gameResult is already present', () => {
    const existing: ClientState = {
      ...emptyClientState,
      gameResult: { won: true, type: GameResultType.Domination, sol: 42 }
    };
    game.state = existing;

    game.showSurrenderOnDisconnect();

    expect(game.state).toBe(existing);
    expect(game.state.gameResult?.won).toBeTrue();
    expect((game as any).add.image as jasmine.Spy).not.toHaveBeenCalled();
  });
});

describe('Game scene - getCardMovementEvent', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
    game.state = {
      ...emptyClientState,
      events: [
        { type: EventType.Retract, playerEvent: true, oldUUID: 'card-1', newUUID: 'hand-1' },
        { type: EventType.Discard, playerEvent: false, oldUUID: 'card-2' }
      ]
    };
  });

  it('returns the movement event for a card that was moved by the server', () => {
    const event = game.getCardMovementEvent('card-1');

    expect(event).toBeDefined();
    expect(event?.type).toBe(EventType.Retract);
    expect(event?.newUUID).toBe('hand-1');
  });

  it('returns the discard event for a discarded card regardless of the owning player', () => {
    const event = game.getCardMovementEvent('card-2');

    expect(event).toBeDefined();
    expect(event?.type).toBe(EventType.Discard);
  });

  it('returns undefined for cards without a movement event', () => {
    expect(game.getCardMovementEvent('card-3')).toBeUndefined();
  });
});
