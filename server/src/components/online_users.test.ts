import { Server, Socket } from 'socket.io';
import { MsgTypeOutbound } from '../shared/config/enums';
import { markOffline, markOnline, onlineUserCount, resetOnlineUsers } from './online_users';

const createSocket = (id: string) => ({ id, emit: jest.fn() });
const asSocket = (socket: ReturnType<typeof createSocket>) => socket as unknown as Socket;

describe('Online users', () => {
  let io: { emit: jest.Mock };

  beforeEach(() => {
    io = { emit: jest.fn() };
  });

  afterEach(() => {
    resetOnlineUsers();
  });

  const server = () => io as unknown as Server;

  test('starts without online users', () => {
    expect(onlineUserCount()).toBe(0);
  });

  test('counts each logged-in user and broadcasts the new count', () => {
    markOnline(server(), asSocket(createSocket('a')), 1);
    markOnline(server(), asSocket(createSocket('b')), 2);

    expect(onlineUserCount()).toBe(2);
    expect(io.emit).toHaveBeenNthCalledWith(1, MsgTypeOutbound.OnlineCount, 1);
    expect(io.emit).toHaveBeenNthCalledWith(2, MsgTypeOutbound.OnlineCount, 2);
  });

  test('counts a user with two sockets once and informs only the new socket', () => {
    const second = createSocket('b');
    markOnline(server(), asSocket(createSocket('a')), 1);
    io.emit.mockClear();

    markOnline(server(), asSocket(second), 1);

    expect(onlineUserCount()).toBe(1);
    expect(io.emit).not.toHaveBeenCalled();
    expect(second.emit).toHaveBeenCalledWith(MsgTypeOutbound.OnlineCount, 1);
  });

  test('keeps the user online until the last of their sockets disconnects', () => {
    const [first, second] = [createSocket('a'), createSocket('b')];
    markOnline(server(), asSocket(first), 1);
    markOnline(server(), asSocket(second), 1);
    io.emit.mockClear();

    markOffline(server(), asSocket(first));
    expect(onlineUserCount()).toBe(1);
    expect(io.emit).not.toHaveBeenCalled();

    markOffline(server(), asSocket(second));
    expect(onlineUserCount()).toBe(0);
    expect(io.emit).toHaveBeenCalledWith(MsgTypeOutbound.OnlineCount, 0);
  });

  test('ignores the disconnect of a socket which never logged in', () => {
    markOnline(server(), asSocket(createSocket('a')), 1);
    io.emit.mockClear();

    markOffline(server(), asSocket(createSocket('unauthenticated')));

    expect(onlineUserCount()).toBe(1);
    expect(io.emit).not.toHaveBeenCalled();
  });
});
