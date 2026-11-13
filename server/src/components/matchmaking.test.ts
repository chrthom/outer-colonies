import { Server, Socket } from 'socket.io';
import SocketData from './game_state/socket_data';
import Card from './cards/card';
import CardCollection from './cards/collection/card_collection';
import { matchmakingRoom, matchMakingSocketListeners } from './matchmaking';
import { DBCredential } from './persistence/db_credentials';
import { MsgTypeInbound, MsgTypeOutbound } from '../shared/config/enums';

const activeDeck = CardCollection.starterDecks[0].slice();

const createUser = (): DBCredential => ({
  userId: 1,
  username: 'Human',
  email: 'human@example.com',
  sessionToken: null
});

/**
 * Mock socket whose registered message handlers can be triggered manually,
 * like a real socket does when a client message arrives.
 */
function createSocket(data?: SocketData): {
  socket: Socket;
  handlers: Map<string, (...args: unknown[]) => void>;
} {
  const handlers = new Map<string, (...args: unknown[]) => void>();
  const socket = {
    id: 'socket-0',
    data: data,
    on: jest.fn((message: string, handler: (...args: unknown[]) => void) => handlers.set(message, handler)),
    emit: jest.fn(),
    join: jest.fn(),
    leave: jest.fn()
  } as unknown as Socket;
  return { socket, handlers };
}

/** Mock io server providing the emitting and socket lookup APIs used by the handlers. */
function createIO(sockets: Socket[]): { io: Server; broadcast: { emit: jest.Mock } } {
  const broadcast = { emit: jest.fn() };
  const io = {
    sockets: {
      sockets: new Map(sockets.map(socket => [socket.id, socket])),
      to: jest.fn(() => broadcast)
    }
  } as unknown as Server;
  return { io, broadcast };
}

/** Socket data of a logged-in player, optionally with an empty active deck. */
function createSocketData(deck: Card[] = activeDeck): SocketData {
  return new SocketData(createUser(), deck);
}

describe('StartBotGame handler', () => {
  function setup(data?: SocketData) {
    const { socket, handlers } = createSocket(data);
    const { io, broadcast } = createIO([socket]);
    matchMakingSocketListeners(io, socket);
    const startBotGame = () => handlers.get(MsgTypeInbound.StartBotGame)!();
    return { socket, broadcast, startBotGame };
  }

  test('rejects the request before login and keeps the socket in the matchmaking room', () => {
    const { socket, startBotGame } = setup(undefined);

    startBotGame();

    expect(socket.leave).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(MsgTypeOutbound.Matchmaking, 'botRejected');
  });

  test('rejects the request without an active deck and keeps the socket in the matchmaking room', () => {
    const { socket, startBotGame } = setup(createSocketData([]));

    startBotGame();

    expect(socket.leave).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(MsgTypeOutbound.Matchmaking, 'botRejected');
  });

  test('rejects the request while already in a match', () => {
    const socketData = createSocketData();
    socketData.match = {} as never;
    const { socket, broadcast, startBotGame } = setup(socketData);

    startBotGame();

    expect(socket.leave).not.toHaveBeenCalled();
    expect(broadcast.emit).not.toHaveBeenCalled();
  });

  test('starts a bot game for a logged-in player with an active deck', () => {
    const socketData = createSocketData();
    const { socket, broadcast, startBotGame } = setup(socketData);

    startBotGame();

    // The player leaves the matchmaking room, so the cron can no longer pair it
    expect(socket.leave).toHaveBeenCalledWith(matchmakingRoom);
    expect(broadcast.emit).toHaveBeenCalledWith(
      MsgTypeOutbound.Matchmaking,
      'start',
      expect.objectContaining({ preloadCardIds: expect.any(Array) })
    );
    const match = socketData.match;
    expect(match).toBeDefined();
    expect(match!.players[1].isBot).toBe(true);
    expect(match!.bot).toBeDefined();
  });
});
