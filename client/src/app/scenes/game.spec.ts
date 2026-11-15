import Game from './game';
import { EventType, GameResultType, TurnPhase } from '@shared/config/enums';
import {
  ClientGameResult,
  ClientHandCard,
  ClientState,
  emptyClientState
} from '@shared/interfaces/client_state';
import { animationConfig } from '../config/animation';

/**
 * Test double for Phaser's clock: records delayed calls so tests can fire
 * them manually, which makes the state update pipeline testable without
 * Phaser timers.
 */
class FakeClock {
  readonly entries: Array<{ delay: number; callback: () => void }> = [];

  delayedCall = (delay: number, callback: () => void) => {
    this.entries.push({ delay, callback });
  };

  /** Fires and removes the oldest scheduled delayed call (mimics an elapsed timer). */
  fireOldest() {
    const entry = this.entries.shift();
    if (!entry) throw new Error('No delayed call scheduled');
    entry.callback();
  }

  /** Fires all scheduled delayed calls, including those scheduled while firing. */
  fireAll() {
    while (this.entries.length) this.fireOldest();
  }
}

function handCard(uuid: string, cardId = 1): ClientHandCard {
  return {
    uuid,
    cardId,
    index: 0,
    playable: true,
    validTargets: [],
    ownedByPlayer: true,
    optionsToSelect: 0
  };
}

function makeState(over: Partial<ClientState> = {}): ClientState {
  return { ...emptyClientState, ...over };
}

/** Creates a Game instance with a fake clock and spied update helpers. */
function setupGame() {
  const game = new Game();
  const clock = new FakeClock();
  (game as any).time = { delayedCall: clock.delayedCall };
  (game as any).preloader = { destroy: () => {} };
  const updateCardStacks = jasmine.createSpy('updateCardStacks');
  const updateHandCards = jasmine.createSpy('updateHandCards');
  const updateView = jasmine.createSpy('updateView');
  const highlightAttackIntervention = jasmine.createSpy('highlightAttackIntervention');
  (game as any).updateCardStacks = updateCardStacks;
  (game as any).updateHandCards = updateHandCards;
  (game as any).updateView = updateView;
  (game as any).highlightAttackIntervention = highlightAttackIntervention;
  const playerDiscardPile = jasmine.createSpy('playerDiscardPile.update');
  const opponentDiscardPile = jasmine.createSpy('opponentDiscardPile.update');
  (game as any).player = { hand: [], discardPile: { update: playerDiscardPile } };
  (game as any).opponent = { hand: [], discardPile: { update: opponentDiscardPile } };
  return {
    game,
    clock,
    updateCardStacks,
    updateHandCards,
    updateView,
    highlightAttackIntervention,
    playerDiscardPile,
    opponentDiscardPile
  };
}

function makeRenderStubs() {
  // GameOverIndicator calls scene.add.image(...).setOrigin().setDepth().setAlpha()
  // and scene.add.text(...).setFontSize().setFontFamily().setColor().setDepth()
  //   .setOrigin().setAlpha() then accesses postFX.addShadow.
  // Background (constructed by Game.init()) additionally calls scene.add.group(),
  // scene.time.delayedCall(...) and chains setAngle(), setScale() and setTint().
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
      'setVisible',
      'setAngle',
      'setScale',
      'setTint'
    ].forEach(method => (stub[method] = jasmine.createSpy(method).and.returnValue(stub)));
    return stub;
  };
  return {
    add: {
      group: jasmine.createSpy('group').and.returnValue({}),
      image: jasmine.createSpy('image').and.callFake(chainable),
      text: jasmine.createSpy('text').and.callFake(chainable),
      particles: jasmine.createSpy('particles').and.callFake(chainable)
    },
    time: { delayedCall: jasmine.createSpy('delayedCall') },
    tweens: { add: jasmine.createSpy('tweens.add') }
  };
}

/** The GameOverIndicator constructor renders one image and three text labels. */
function expectSingleIndicator(game: Game) {
  expect((game as any).add.image as jasmine.Spy).toHaveBeenCalledTimes(1);
  expect((game as any).add.text as jasmine.Spy).toHaveBeenCalledTimes(3);
}

function makeGame(): Game {
  const game = new Game();
  const stubs = makeRenderStubs();
  (game as any).add = stubs.add;
  (game as any).time = stubs.time;
  (game as any).tweens = stubs.tweens;
  game.state = emptyClientState;
  return game;
}

describe('Game scene - showSurrenderOnDisconnect', () => {
  let game: Game;

  beforeEach(() => {
    game = makeGame();
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

describe('Game scene - showGameOverIndicator', () => {
  let game: Game;

  beforeEach(() => {
    game = makeGame();
  });

  it('creates the overlay exactly once regardless of how often it is called', () => {
    const result: ClientGameResult = { won: true, type: GameResultType.Domination, sol: 42 };

    game.showGameOverIndicator(result);
    game.showGameOverIndicator(result);
    game.showGameOverIndicator({ ...result, sol: 0 });

    expectSingleIndicator(game);
  });

  it('does not create a second overlay when updates follow a disconnect surrender', () => {
    game.showSurrenderOnDisconnect();

    // Simulates the ContinueButton.update() path after further updateView() calls
    game.showGameOverIndicator(game.state.gameResult!);
    game.showGameOverIndicator(game.state.gameResult!);

    expectSingleIndicator(game);
  });

  it('shows a fresh overlay in the next match after init() resets the reference', () => {
    game.showSurrenderOnDisconnect();

    game.init({
      gameParams: { preloadCardIds: [] },
      socket: { io: { reconnection: () => undefined } } as any
    });
    ((game as any).add.image as jasmine.Spy).calls.reset();
    ((game as any).add.text as jasmine.Spy).calls.reset();

    game.showGameOverIndicator({ won: true, type: GameResultType.Domination, sol: 5 });

    expectSingleIndicator(game);
  });
});

describe('Game scene - state update pipeline', () => {
  it('runs the full update chain for a single state', () => {
    const {
      game,
      clock,
      updateCardStacks,
      updateHandCards,
      updateView,
      highlightAttackIntervention,
      playerDiscardPile,
      opponentDiscardPile
    } = setupGame();
    const state = makeState({
      turnPhase: TurnPhase.Build,
      player: { ...emptyClientState.player, discardPileIds: [7], hand: [handCard('p1', 10)] },
      opponent: { ...emptyClientState.opponent, discardPileIds: [8] }
    });

    game.updateState(state);
    clock.fireAll();

    expect(updateCardStacks).toHaveBeenCalledTimes(1);
    expect(updateCardStacks).toHaveBeenCalledWith();
    expect(updateHandCards).toHaveBeenCalledTimes(1);
    expect(updateHandCards).toHaveBeenCalledWith([handCard('p1', 10)]);
    expect(updateView).toHaveBeenCalledTimes(1);
    expect(highlightAttackIntervention).toHaveBeenCalledTimes(1);
    expect(playerDiscardPile).toHaveBeenCalledWith([7]);
    expect(opponentDiscardPile).toHaveBeenCalledWith([8]);
  });

  it('renders the newest state when a second state arrives mid-chain', () => {
    const { game, clock, updateCardStacks, updateHandCards, playerDiscardPile, opponentDiscardPile } =
      setupGame();
    const state1 = makeState({
      turnPhase: TurnPhase.Build,
      player: { ...emptyClientState.player, hand: [handCard('p1', 10)] }
    });
    game.updateState(state1);
    clock.fireOldest(); // Chain 1 applied its card stacks step
    const state2 = makeState({
      turnPhase: TurnPhase.Combat,
      player: { ...emptyClientState.player, discardPileIds: [3], hand: [handCard('p2', 20)] },
      opponent: { ...emptyClientState.opponent, discardPileIds: [4] }
    });

    game.updateState(state2); // Supersedes the pending steps of chain 1
    clock.fireAll();

    expect(game.state).toBe(state2);
    // Each chain ran its card stacks step exactly once
    expect(updateCardStacks).toHaveBeenCalledTimes(2);
    // The hand update ran only for the newest state, with the new hand
    // cards captured from that state
    expect(updateHandCards).toHaveBeenCalledTimes(1);
    expect(updateHandCards).toHaveBeenCalledWith([handCard('p2', 20)]);
    // The discard piles were updated from the newest state only
    expect(playerDiscardPile).toHaveBeenCalledTimes(1);
    expect(playerDiscardPile).toHaveBeenCalledWith([3]);
    expect(opponentDiscardPile).toHaveBeenCalledWith([4]);
  });

  it('skips every step of a chain that was superseded before it started', () => {
    const { game, clock, updateCardStacks, updateHandCards, playerDiscardPile } = setupGame();
    const state1 = makeState({
      player: { ...emptyClientState.player, discardPileIds: [1], hand: [handCard('p1', 10)] }
    });
    game.updateState(state1);
    const state2 = makeState({
      player: { ...emptyClientState.player, discardPileIds: [2], hand: [handCard('p2', 20)] }
    });

    game.updateState(state2); // Supersedes chain 1 before any of its steps ran
    clock.fireAll();

    expect(updateCardStacks).toHaveBeenCalledTimes(1);
    expect(updateHandCards).toHaveBeenCalledTimes(1);
    expect(updateHandCards).toHaveBeenCalledWith([handCard('p2', 20)]);
    expect(playerDiscardPile).toHaveBeenCalledTimes(1);
    expect(playerDiscardPile).toHaveBeenCalledWith([2]);
  });

  it('waits for the attack animation before updating the card stacks', () => {
    const { game, clock, updateCardStacks } = setupGame();
    const state = makeState({
      battle: {
        ...emptyClientState.battle,
        recentAttack: {
          sourceRootUUID: 'src-root',
          sourceSubUUID: 'src-sub',
          targetUUID: 'target',
          pointDefense: 0,
          shield: 0,
          armour: 0,
          damage: 1
        }
      }
    });

    game.updateState(state);

    expect(game.isAttackAnimating).toBeTrue();
    // The attack animation reset and the chain's first step are both
    // scheduled with the attack duration
    expect(clock.entries.map(e => e.delay)).toEqual([
      animationConfig.duration.attack,
      animationConfig.duration.attack
    ]);
    clock.fireOldest(); // Resets isAttackAnimating
    expect(game.isAttackAnimating).toBeFalse();
    expect(updateCardStacks).not.toHaveBeenCalled();
    clock.fireOldest(); // Chain step 1
    expect(updateCardStacks).toHaveBeenCalledTimes(1);
  });

  it('delays the hand update when a retract animation was detected', () => {
    const { game, clock, updateCardStacks, updateHandCards } = setupGame();
    updateCardStacks.and.callFake(() => (game.retractCardsExist = true));

    game.updateState(makeState());
    clock.fireOldest(); // Step 1 detects a retract via updateCardStacks

    expect(clock.entries[0].delay).toBe(animationConfig.duration.move);
    expect(updateHandCards).not.toHaveBeenCalled();
    clock.fireOldest();
    expect(updateHandCards).toHaveBeenCalledTimes(1);
  });
});
