import Match, { BotPlayerSetup } from '../game_state/match';
import Player from '../game_state/player';
import Bot, { BotScheduler, defaultBotReactionDelays } from './bot';
import CardCollection from '../cards/collection/card_collection';
import { Server, Socket } from 'socket.io';
import { EventType, MsgTypeOutbound, TurnPhase } from '../../shared/config/enums';
import { ClientState, emptyClientState } from '../../shared/interfaces/client_state';
import { rules } from '../../shared/config/rules';
import * as gameHandlers from '../game';

const humanDeck = CardCollection.starterDecks[0].slice();

function createHumanSocket(): Socket {
  return {
    id: 'human-socket',
    join: jest.fn(),
    emit: jest.fn(),
    data: {
      user: { username: 'Human' },
      activeDeck: humanDeck
    }
  } as unknown as Socket;
}

function createIO(socket: Socket): Server {
  return {
    sockets: {
      sockets: new Map([[socket.id, socket]])
    }
  } as unknown as Server;
}

/**
 * Controllable bot scheduler for tests: records scheduled reactions along with
 * their requested delay and exposes explicit flushing/cancellation helpers.
 */
class FakeBotScheduler implements BotScheduler {
  readonly pending: Array<{ id: number; delayMs: number; callback: () => void; cancelled: boolean }> = [];
  private nextId = 1;

  schedule = (delayMs: number, callback: () => void) => {
    const entry = { id: this.nextId++, delayMs, callback, cancelled: false };
    this.pending.push(entry);
    return entry;
  };

  cancel = (handle: unknown) => {
    const entry = this.pending.find(e => e === handle);
    if (entry) entry.cancelled = true;
  };

  /** Runs the next non-cancelled scheduled callback. Returns false when none remain. */
  flushNext(): boolean {
    while (this.pending.length > 0) {
      const entry = this.pending.shift()!;
      if (!entry.cancelled) {
        entry.callback();
        return true;
      }
    }
    return false;
  }

  /** Drains all scheduled callbacks, including those scheduled while draining. */
  flushAll(maxSteps: number = 100): number {
    let steps = 0;
    while (steps < maxSteps && this.flushNext()) steps++;
    return steps;
  }
}

/**
 * Plays the human side automatically through the regular game handlers, like a
 * player who lets the countdown expire in every phase.
 */
function autoPlayHuman(io: Server, match: Match, player: Player) {
  if (match.turnPhase == TurnPhase.End && player.hand.length > player.handCardLimit) {
    gameHandlers.onDiscard(io, match, player, player.hand[0].uuid);
  } else if (match.intervention) {
    gameHandlers.onReady(io, match, player, match.turnPhase);
  } else if (match.turnPhase != TurnPhase.Init) {
    player.handleAutomaticReady();
    match.emitState(io);
  }
}

describe('Bot', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('a bot player is created without socket and marked as bot', () => {
    const { match } = createBotMatch();
    const botPlayer = match.players[1];

    expect(botPlayer.isBot).toBe(true);
    expect(botPlayer.socketId).toBeUndefined();
    expect(match.players[0].isBot).toBe(false);
  });

  test('readies up for match initialization via onReady and starts when human readies', () => {
    const { match, io, socket } = createBotMatch();
    const onReadySpy = jest.spyOn(gameHandlers, 'onReady');

    match.bot!.onMatchStart(io);
    expect(onReadySpy).toHaveBeenCalledWith(io, match, match.players[1], TurnPhase.Init);
    expect(match.players[1].ready).toBe(true);

    gameHandlers.onReady(io, match, match.players[0], TurnPhase.Init);

    expect(match.players.every(player => player.ready)).toBe(true);
    expect(match.turnPhase == TurnPhase.Start || match.turnPhase == TurnPhase.Build).toBe(true);
    expect(match.players[0].hand.length + match.players[1].hand.length).toBe(
      rules.initialCardsToDraw * 2 + rules.cardsToDrawPerTurn
    );
    expect(socket.emit).toHaveBeenCalledWith(MsgTypeOutbound.State, expect.any(Object));
  });

  test('executes one paced action per emitted state instead of running synchronously in a batch', () => {
    const { match, io, socket, scheduler } = createBotMatch();
    const onHandCardSpy = jest.spyOn(gameHandlers, 'onHandCard');

    match.bot!.onMatchStart(io);
    jest.spyOn(match, 'setSecondPlayer').mockImplementation(() => {
      // Bot (player 1) takes the first turn
      match.activePlayerNo = 0;
    });
    gameHandlers.onReady(io, match, match.players[0], TurnPhase.Init);

    // Initial state was emitted to the human, and the bot scheduled exactly one reaction
    expect(match.activePlayerNo).toBe(1);
    const activeTimers = () => scheduler.pending.filter(e => !e.cancelled);
    expect(activeTimers().length).toBe(1);
    expect(activeTimers()[0].delayMs).toBe(defaultBotReactionDelays.normal);
    expect(onHandCardSpy).not.toHaveBeenCalled();

    const emittedStatesBefore = (socket.emit as jest.Mock).mock.calls.filter(
      c => c[0] == MsgTypeOutbound.State
    ).length;

    // Flushing one scheduled callback triggers exactly one action and emits one state
    expect(scheduler.flushNext()).toBe(true);
    const emittedStatesAfter = (socket.emit as jest.Mock).mock.calls.filter(
      c => c[0] == MsgTypeOutbound.State
    ).length;
    expect(emittedStatesAfter).toBe(emittedStatesBefore + 1);
  });

  test('uses longer reaction delays after attacks, retracts and highlighted tactic cards', () => {
    const { match, io, scheduler } = createBotMatch();
    const baseState: ClientState = { ...emptyClientState, playerPendingAction: true };

    match.bot!.onState(io, baseState);
    expect(scheduler.pending.at(-1)?.delayMs).toBe(defaultBotReactionDelays.normal);

    match.bot!.onState(io, { ...baseState, highlightCardUUID: 'tactic-1' });
    expect(scheduler.pending.at(-1)?.delayMs).toBe(defaultBotReactionDelays.tactic);

    match.bot!.onState(io, {
      ...baseState,
      events: [{ type: EventType.Retract, playerEvent: true, oldUUID: 'old-1', newUUID: 'new-1' }]
    });
    expect(scheduler.pending.at(-1)?.delayMs).toBe(defaultBotReactionDelays.retract);

    match.bot!.onState(io, {
      ...baseState,
      battle: {
        ...emptyClientState.battle,
        recentAttack: {
          sourceRootUUID: 's1',
          sourceSubUUID: 'w1',
          targetUUID: 't1',
          pointDefense: 0,
          shield: 0,
          armour: 0,
          damage: 2
        }
      }
    });
    expect(scheduler.pending.at(-1)?.delayMs).toBe(defaultBotReactionDelays.attack);
  });

  test('cancels a pending bot reaction when the match ends by surrender', () => {
    const { match, io, scheduler } = createBotMatch();

    match.bot!.onMatchStart(io);
    jest.spyOn(match, 'setSecondPlayer').mockImplementation(() => {
      match.activePlayerNo = 0;
    });
    gameHandlers.onReady(io, match, match.players[0], TurnPhase.Init);
    expect(scheduler.pending.filter(e => !e.cancelled).length).toBe(1);

    match.gameResult.setWinnerBySurrender(match.players[0]);
    expect(scheduler.pending.filter(e => !e.cancelled).length).toBe(0);
    // Even if a callback runs, it must be a no-op after gameOver
    expect(scheduler.flushAll()).toBe(0);
  });

  test.each([0, 1, 2])('a full game against the bot (deck %i) finishes without stalling', deckIndex => {
    const { match, io, scheduler } = createBotMatch(deckIndex);

    match.bot!.onMatchStart(io);
    gameHandlers.onReady(io, match, match.players[0], TurnPhase.Init);

    let iterations = 0;
    while (!match.gameResult.gameOver) {
      scheduler.flushAll(200);
      if (match.gameResult.gameOver) break;
      if (match.pendingActionPlayerNo == 0) autoPlayHuman(io, match, match.players[0]);
      if (++iterations > 5000) throw new Error('Bot game stalled: exceeded 5000 iterations');
    }

    expect(match.gameResult.gameOver).toBe(true);
    expect(match.gameResult.type).toBeDefined();
    expect(match.gameResult.winnerNo).toBeDefined();
  });
});

function createBotMatch(deckIndex: number = 1): {
  match: Match;
  io: Server;
  socket: Socket;
  scheduler: FakeBotScheduler;
} {
  const socket = createHumanSocket();
  const io = createIO(socket);
  const scheduler = new FakeBotScheduler();
  const match = new Match(
    'test-room',
    socket,
    new BotPlayerSetup('Bot', CardCollection.botDecks[deckIndex].slice())
  );
  match.bot = new Bot(match, 1, scheduler);
  return { match, io, socket, scheduler };
}
