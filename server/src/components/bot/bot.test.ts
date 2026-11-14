import Match, { BotPlayerSetup } from '../game_state/match';
import Player from '../game_state/player';
import Bot, { processBotActions } from './bot';
import CardCollection from '../cards/collection/card_collection';
import DBCredentialsDAO from '../persistence/db_credentials';
import { Server, Socket } from 'socket.io';
import { TurnPhase } from '../../shared/config/enums';
import { rules } from '../../shared/config/rules';

const humanDeck = CardCollection.starterDecks[0].slice();
const botDeck = CardCollection.botDecks[1].slice();

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
 * Plays the human side automatically, like a player who lets the countdown
 * expire in every phase: skips interventions, discards excess cards in the end
 * phase and otherwise relies on the automatic ready fallback.
 */
function autoPlayHuman(match: Match, player: Player) {
  if (match.turnPhase == TurnPhase.End && player.hand.length > player.handCardLimit) {
    player.discardHandCards(player.hand[0].uuid);
    match.prepareEndPhase();
  } else if (match.intervention) {
    match.skipIntervention();
  } else if (match.turnPhase != TurnPhase.Init) {
    player.handleAutomaticReady();
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

  test('readies up for match initialization and starts the match', () => {
    const { match, io } = createBotMatch();

    processBotActions(io, match); // Bot readies up for match initialization
    match.setReadyAndCheck(0);

    expect(match.players[1].ready).toBe(true);
    expect(match.players.every(player => player.ready)).toBe(true);
    match.startMatch();
    expect(match.turnPhase == TurnPhase.Start || match.turnPhase == TurnPhase.Build).toBe(true);
    expect(match.players[0].hand.length + match.players[1].hand.length).toBe(
      rules.initialCardsToDraw * 2 + rules.cardsToDrawPerTurn
    );
  });

  test('a full game against the bot finishes without the bot stalling', () => {
    // Prevent real DB access when the game result is persisted
    jest.spyOn(DBCredentialsDAO, 'getByUsername').mockResolvedValue(undefined as never);
    const { match, io } = createBotMatch();

    processBotActions(io, match); // Bot readies up for match initialization
    match.setReadyAndCheck(0);
    match.startMatch();

    let iterations = 0;
    while (!match.gameResult.gameOver) {
      // The bot must never stall: whenever it is its turn, it acts immediately
      processBotActions(io, match);
      if (match.gameResult.gameOver) break;
      if (match.pendingActionPlayerNo == 0) autoPlayHuman(match, match.players[0]);
      match.emitState(io);
      if (++iterations > 5000) throw new Error('Bot game stalled: exceeded 5000 iterations');
    }

    expect(match.gameResult.gameOver).toBe(true);
    expect(match.gameResult.type).toBeDefined();
    expect(match.gameResult.winnerNo).toBeDefined();
  });
});

function createBotMatch(): { match: Match; io: Server } {
  const socket = createHumanSocket();
  const io = createIO(socket);
  const match = new Match('test-room', socket, new BotPlayerSetup('Bot', botDeck));
  match.bot = new Bot(match, 1);
  return { match, io };
}
