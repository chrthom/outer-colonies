import { Server, Socket } from 'socket.io';
import { matchMakingCron, matchMakingSocketListeners, matchmakingRoom } from './matchmaking';
import { allActiveMatches, findRejoinableMatch, registerMatch, unregisterMatch } from './match_registry';
import Match from './game_state/match';
import SocketData from './game_state/socket_data';
import DBCredentialsDAO from './persistence/db_credentials';
import DBDecksDAO from './persistence/db_decks';
import { MatchmakingStatus, MsgTypeInbound, MsgTypeOutbound } from '../shared/config/enums';
import { rules } from '../shared/config/rules';

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

const createSocketMock = (userId: number): SocketMock => {
  const on = jest.fn();
  const emit = jest.fn();
  const rooms = new Set<string>();
  const join = jest.fn((room: string) => rooms.add(room));
  const leave = jest.fn((room: string) => rooms.delete(room));
  const socket = {
    id: `socket-${userId}`,
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

  test('does not end the search of a client which waited briefly', () => {
    const socketMocks = [createSocketMock(1)];
    const io = createIoMock(socketMocks);

    matchMakingCron(io);

    expect(socketMocks[0].leave).not.toHaveBeenCalled();
    expect(socketMocks[0].emit).not.toHaveBeenCalled();
  });

  test('ends the search of a lone client after the timeout', () => {
    const socketMocks = [createSocketMock(1)];
    (<SocketData>socketMocks[0].socket.data).searchStartedAt =
      Date.now() - (rules.matchmakingTimeout * 1000 + 1000);
    const io = createIoMock(socketMocks);

    matchMakingCron(io);

    expect(socketMocks[0].leave).toHaveBeenCalledWith(matchmakingRoom);
    expect(socketMocks[0].emit).toHaveBeenCalledWith(MsgTypeOutbound.Matchmaking, MatchmakingStatus.Timeout);
  });
});

describe('Matchmaking login', () => {
  afterEach(() => {
    allActiveMatches().forEach(unregisterMatch);
    jest.restoreAllMocks();
  });

  test('lets a player without a running match join the matchmaking search', async () => {
    const socketMock = createSocketMock(1);
    mockLogin(1);

    await getLoginHandler(createIoMock([socketMock]), socketMock)('token-1');

    expect(socketMock.join).toHaveBeenCalledWith(matchmakingRoom);
    expect(socketMock.emit).toHaveBeenCalledWith(MsgTypeOutbound.Matchmaking, MatchmakingStatus.Search, 0);
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
    const rejoinSocket = createSocketMock(1); // Same user, new socket
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

  test('makes a finished match rejoinable no more', async () => {
    const matchSockets = [createSocketMock(1), createSocketMock(2)];
    const match = new Match('test-room', matchSockets[0].socket, matchSockets[1].socket);
    registerMatch(match);
    match.gameResult.gameOver = true;
    const socketMock = createSocketMock(1);
    mockLogin(1);

    await getLoginHandler(createIoMock([socketMock]), socketMock)('token-1');

    expect(socketMock.join).toHaveBeenCalledWith(matchmakingRoom);
    expect(findRejoinableMatch(1)).toBeUndefined();
  });
});
