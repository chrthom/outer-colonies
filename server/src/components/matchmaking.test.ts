import { Server, Socket } from 'socket.io';
import { matchMakingCron, matchMakingSocketListeners, matchmakingRoom } from './matchmaking';
import { allActiveMatches, findRejoinableMatch, registerMatch, unregisterMatch } from './match_registry';
import { gameSocketListeners } from './game';
import Match from './game_state/match';
import SocketData from './game_state/socket_data';
import Card from './cards/card';
import CardCollection from './cards/collection/card_collection';
import DBCredentialsDAO, { DBCredential } from './persistence/db_credentials';
import DBDecksDAO from './persistence/db_decks';
import { onlineUserCount, resetOnlineUsers } from './online_users';
import { MatchmakingStatus, MsgTypeInbound, MsgTypeOutbound } from '../shared/config/enums';

const createUser = (userId: number) => ({
  userId,
  username: `Player ${userId}`,
  email: `player${userId}@example.com`,
  sessionToken: `token-${userId}`
});

interface SocketMock {
  socket: Socket;
  on: jest.Mock;
  emit: jest.Mock;
  join: jest.Mock;
  leave: jest.Mock;
  rooms: Set<string>;
}

const createSocketMock = (userId: number, socketId: string = `socket-${userId}`): SocketMock => {
  const on = jest.fn();
  const emit = jest.fn();
  const rooms = new Set<string>();
  const join = jest.fn((room: string) => rooms.add(room));
  const leave = jest.fn((room: string) => rooms.delete(room));
  const socket = {
    id: socketId,
    on,
    emit,
    join,
    leave,
    data: new SocketData(createUser(userId), [])
  };
  return { socket: socket as unknown as Socket, on, emit, join, leave, rooms };
};

const createIoMock = (socketMocks: SocketMock[]): Server => {
  const sockets = socketMocks.map(m => m.socket);
  const io = {
    emit: jest.fn(),
    sockets: {
      adapter: { rooms: new Map<string, Set<string>>() },
      sockets: { get: (id: string) => sockets.find(s => s.id == id) },
      to: (room: string) => ({
        emit: (event: string, ...args: unknown[]) =>
          socketMocks.filter(m => m.rooms.has(room)).forEach(m => m.emit(event, ...args))
      })
    }
  };
  io.sockets.adapter.rooms.set(matchmakingRoom, new Set(sockets.map(s => s.id)));
  return io as unknown as Server;
};

const getLoginHandler = (io: Server, socketMock: SocketMock): ((sessionToken: string) => Promise<void>) => {
  matchMakingSocketListeners(io, socketMock.socket);
  const registration = socketMock.on.mock.calls.find(([event]) => event == MsgTypeInbound.Login);
  if (!registration) throw new Error('Login handler was not registered');
  return registration[1];
};

const mockLogin = (userId: number) => {
  jest.spyOn(DBCredentialsDAO, 'getBySessionToken').mockResolvedValue(createUser(userId));
  jest.spyOn(DBDecksDAO, 'getByUserId').mockResolvedValue([]);
};

describe('Matchmaking cron', () => {
  afterEach(() => {
    allActiveMatches().forEach(unregisterMatch);
    jest.restoreAllMocks();
  });

  test('pairs two waiting clients into a match', () => {
    const socketMocks = [createSocketMock(1), createSocketMock(2)];
    const io = createIoMock(socketMocks);

    matchMakingCron(io);

    expect(allActiveMatches()).toHaveLength(1);
    const match = allActiveMatches()[0];
    expect(socketMocks[0].leave).toHaveBeenCalledWith(matchmakingRoom);
    expect(socketMocks[1].leave).toHaveBeenCalledWith(matchmakingRoom);
    expect(socketMocks[0].join).toHaveBeenCalledWith(match.room);
    expect(socketMocks[1].join).toHaveBeenCalledWith(match.room);
    socketMocks.forEach(sm =>
      expect(sm.emit).toHaveBeenCalledWith(MsgTypeOutbound.Matchmaking, MatchmakingStatus.Start, {
        preloadCardIds: []
      })
    );
    expect((<SocketData>socketMocks[0].socket.data).match).toBe(match);
    expect((<SocketData>socketMocks[1].socket.data).match).toBe(match);
  });

  test('pairs an odd client only once and lets the leftover keep searching', () => {
    const socketMocks = [createSocketMock(1), createSocketMock(2), createSocketMock(3)];
    const io = createIoMock(socketMocks);

    matchMakingCron(io);

    expect(allActiveMatches()).toHaveLength(1);
    // The leftover client stays in the matchmaking room and keeps searching
    expect(socketMocks[0].leave).not.toHaveBeenCalled();
    expect(socketMocks[0].emit).not.toHaveBeenCalled();
  });
});

describe('Matchmaking login', () => {
  afterEach(() => {
    allActiveMatches().forEach(unregisterMatch);
    resetOnlineUsers();
    jest.restoreAllMocks();
  });

  test('lets a player without a running match join the matchmaking search', async () => {
    const socketMock = createSocketMock(1);
    mockLogin(1);

    await getLoginHandler(createIoMock([socketMock]), socketMock)('token-1');

    expect(socketMock.join).toHaveBeenCalledWith(matchmakingRoom);
    expect(socketMock.emit).toHaveBeenCalledWith(MsgTypeOutbound.Matchmaking, MatchmakingStatus.Search, 0);
  });

  test('counts the user as online and broadcasts the new count on login', async () => {
    const socketMock = createSocketMock(1);
    const io = createIoMock([socketMock]);
    mockLogin(1);

    await getLoginHandler(io, socketMock)('token-1');

    expect(io.emit).toHaveBeenCalledWith(MsgTypeOutbound.OnlineCount, 1);
    expect(onlineUserCount()).toBe(1);
  });

  test('does not count the user as online when the session token is invalid', async () => {
    const socketMock = createSocketMock(1);
    const io = createIoMock([socketMock]);
    jest.spyOn(DBCredentialsDAO, 'getBySessionToken').mockRejectedValue('not_found');

    await getLoginHandler(io, socketMock)('invalid-token');

    expect(io.emit).not.toHaveBeenCalled();
    expect(onlineUserCount()).toBe(0);
  });

  test('does not count a socket which disconnected during the login', async () => {
    const socketMock = createSocketMock(1);
    (socketMock.socket as { disconnected: boolean }).disconnected = true;
    mockLogin(1);

    await getLoginHandler(createIoMock([socketMock]), socketMock)('token-1');

    expect(onlineUserCount()).toBe(0);
  });

  test('does not join the search when the session token is invalid', async () => {
    const socketMock = createSocketMock(1);
    jest.spyOn(DBCredentialsDAO, 'getBySessionToken').mockRejectedValue('not_found');

    await getLoginHandler(createIoMock([socketMock]), socketMock)('invalid-token');

    expect(socketMock.join).not.toHaveBeenCalled();
    expect(socketMock.emit).not.toHaveBeenCalled();
  });

  test('lets a player rejoin their running match instead of searching again', async () => {
    const matchSockets = [createSocketMock(1), createSocketMock(2)];
    const match = new Match('test-room', matchSockets[0].socket, matchSockets[1].socket);
    registerMatch(match);
    match.players[0].disconnectedSince = Date.now();
    const rejoinSocket = createSocketMock(1, 'socket-1-rejoin'); // Same user, new socket
    mockLogin(1);

    await getLoginHandler(createIoMock([rejoinSocket]), rejoinSocket)('token-1');

    expect(rejoinSocket.join).toHaveBeenCalledWith('test-room');
    expect(rejoinSocket.join).not.toHaveBeenCalledWith(matchmakingRoom);
    expect(rejoinSocket.emit).toHaveBeenCalledWith(MsgTypeOutbound.Matchmaking, MatchmakingStatus.Start, {
      preloadCardIds: []
    });
    expect(match.players[0].socketId).toBe(rejoinSocket.socket.id);
    expect(match.players[0].disconnectedSince).toBeUndefined();
    expect((<SocketData>rejoinSocket.socket.data).match).toBe(match);
    expect((<SocketData>rejoinSocket.socket.data).playerNo).toBe(0);
  });

  test('detaches the previous socket when the player rejoins', async () => {
    const matchSockets = [createSocketMock(1), createSocketMock(2)];
    const match = new Match('test-room', matchSockets[0].socket, matchSockets[1].socket);
    registerMatch(match);
    const rejoinSocket = createSocketMock(1, 'socket-1-rejoin'); // Same user, new socket
    mockLogin(1);

    await getLoginHandler(createIoMock([rejoinSocket, matchSockets[0]]), rejoinSocket)('token-1');

    // The lingering old socket can neither act on the match nor receive its updates
    expect((<SocketData>matchSockets[0].socket.data).match).toBeUndefined();
    expect((<SocketData>matchSockets[0].socket.data).playerNo).toBeUndefined();
    expect(matchSockets[0].leave).toHaveBeenCalledWith('test-room');
    expect(matchSockets[0].rooms).not.toContain('test-room');
  });

  test('does not mark the rejoined player when the replaced socket disconnects late', async () => {
    const matchSockets = [createSocketMock(1), createSocketMock(2)];
    const match = new Match('test-room', matchSockets[0].socket, matchSockets[1].socket);
    registerMatch(match);
    match.players[0].disconnectedSince = Date.now();
    const rejoinSocket = createSocketMock(1, 'socket-1-rejoin'); // Same user, new socket
    mockLogin(1);
    const io = createIoMock([rejoinSocket, matchSockets[0], matchSockets[1]]);

    await getLoginHandler(io, rejoinSocket)('token-1');
    expect(match.players[0].disconnectedSince).toBeUndefined();

    // The stale socket of the previous connection disconnects after the rejoin
    gameSocketListeners(io, matchSockets[0].socket);
    const registration = matchSockets[0].on.mock.calls.find(([event]) => event == MsgTypeInbound.Disconnect);
    if (!registration) throw new Error('Disconnect handler was not registered');
    registration[1]();

    expect(match.players[0].disconnectedSince).toBeUndefined();
    expect(match.gameResult.gameOver).toBe(false);
  });

  test('delivers the missed result of a finished match on the next login', async () => {
    const matchSockets = [createSocketMock(1), createSocketMock(2)];
    const match = new Match('test-room', matchSockets[0].socket, matchSockets[1].socket);
    registerMatch(match);
    // The match ended while the player was offline, so they never saw the result
    match.gameResult.gameOver = true;
    const rejoinSocket = createSocketMock(1, 'socket-1-rejoin'); // Same user, new socket
    mockLogin(1);

    await getLoginHandler(createIoMock([rejoinSocket]), rejoinSocket)('token-1');

    expect(rejoinSocket.join).toHaveBeenCalledWith('test-room');
    expect(rejoinSocket.emit).toHaveBeenCalledWith(MsgTypeOutbound.Matchmaking, MatchmakingStatus.Start, {
      preloadCardIds: []
    });
    expect(match.players[0].socketId).toBe(rejoinSocket.socket.id);
  });

  test('makes a finished match rejoinable no more once its result was delivered', async () => {
    const matchSockets = [createSocketMock(1), createSocketMock(2)];
    const match = new Match('test-room', matchSockets[0].socket, matchSockets[1].socket);
    registerMatch(match);
    match.gameResult.gameOver = true;
    match.players.forEach(p => {
      p.resultDelivered = true;
    });
    const socketMock = createSocketMock(1);
    mockLogin(1);

    await getLoginHandler(createIoMock([socketMock]), socketMock)('token-1');

    expect(socketMock.join).toHaveBeenCalledWith(matchmakingRoom);
    expect(findRejoinableMatch(1)).toBeUndefined();
  });
});

describe('StartBotGame handler', () => {
  const activeDeck = CardCollection.starterDecks[0].slice();

  const createBotGameUser = (): DBCredential => ({
    userId: 1,
    username: 'Human',
    email: 'human@example.com',
    sessionToken: null
  });

  /**
   * Mock socket whose registered message handlers can be triggered manually,
   * like a real socket does when a client message arrives.
   */
  function createBotGameSocket(data?: SocketData): {
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
  function createBotGameIO(sockets: Socket[]): { io: Server; broadcast: { emit: jest.Mock } } {
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
  function createBotGameSocketData(deck: Card[] = activeDeck): SocketData {
    return new SocketData(createBotGameUser(), deck);
  }

  afterEach(() => {
    allActiveMatches().forEach(unregisterMatch);
    jest.restoreAllMocks();
  });

  function setup(data?: SocketData) {
    const { socket, handlers } = createBotGameSocket(data);
    const { io, broadcast } = createBotGameIO([socket]);
    matchMakingSocketListeners(io, socket);
    const startBotGame = () => handlers.get(MsgTypeInbound.StartBotGame)!();
    return { socket, broadcast, startBotGame };
  }

  test('rejects the request before login and keeps the socket in the matchmaking room', () => {
    // socket.io v4 always initializes socket.data as {} before login
    const { socket, startBotGame } = setup({} as SocketData);

    startBotGame();

    expect(socket.leave).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(MsgTypeOutbound.Matchmaking, MatchmakingStatus.BotRejected);
  });

  test('rejects the request without an active deck and keeps the socket in the matchmaking room', () => {
    const { socket, startBotGame } = setup(createBotGameSocketData([]));

    startBotGame();

    expect(socket.leave).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(MsgTypeOutbound.Matchmaking, MatchmakingStatus.BotRejected);
  });

  test('rejects the request while already in a match', () => {
    const socketData = createBotGameSocketData();
    socketData.match = {} as never;
    const { socket, broadcast, startBotGame } = setup(socketData);

    startBotGame();

    expect(socket.leave).not.toHaveBeenCalled();
    expect(broadcast.emit).not.toHaveBeenCalled();
  });

  test('starts a bot game for a logged-in player with an active deck', () => {
    const socketData = createBotGameSocketData();
    const { socket, broadcast, startBotGame } = setup(socketData);

    startBotGame();

    // The player leaves the matchmaking room, so the cron can no longer pair it
    expect(socket.leave).toHaveBeenCalledWith(matchmakingRoom);
    expect(broadcast.emit).toHaveBeenCalledWith(
      MsgTypeOutbound.Matchmaking,
      MatchmakingStatus.Start,
      expect.objectContaining({ preloadCardIds: expect.any(Array) })
    );
    const match = socketData.match;
    expect(match).toBeDefined();
    expect(match!.players[1].isBot).toBe(true);
    expect(match!.bot).toBeDefined();
    // The bot match is registered, so the game cron covers it like a human match
    expect(allActiveMatches()).toContain(match);
  });
});
