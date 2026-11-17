import { Socket } from 'socket.io-client';
import SocketService from './socket_service';

/** Handle for overriding the private socket factory of the SocketService. */
interface SocketServiceOverrides {
  createSocket: () => Socket;
}

describe('SocketService', () => {
  beforeEach(() => {
    SocketService.disconnect();
  });

  afterEach(() => {
    SocketService.disconnect();
  });

  it('throws in getSocket() when no connection was opened', () => {
    expect(() => SocketService.getSocket()).toThrow();
  });

  it('returns the socket opened by connect()', () => {
    const socket = jasmine.createSpyObj('Socket', ['disconnect']);
    spyOn(SocketService as unknown as SocketServiceOverrides, 'createSocket').and.returnValue(socket);

    expect(SocketService.connect()).toBe(socket);
    expect(SocketService.getSocket()).toBe(socket);
  });

  it('disconnects the socket of the previous session when opening a new one', () => {
    const first = jasmine.createSpyObj('Socket', ['disconnect']);
    const second = jasmine.createSpyObj('Socket', ['disconnect']);
    spyOn(SocketService as unknown as SocketServiceOverrides, 'createSocket').and.returnValues(first, second);

    SocketService.connect();
    SocketService.connect();

    expect(first.disconnect).toHaveBeenCalled();
    expect(second.disconnect).not.toHaveBeenCalled();
    expect(SocketService.getSocket()).toBe(second);
  });

  it('disconnects and clears the current connection in disconnect()', () => {
    const socket = jasmine.createSpyObj('Socket', ['disconnect']);
    spyOn(SocketService as unknown as SocketServiceOverrides, 'createSocket').and.returnValue(socket);
    SocketService.connect();

    SocketService.disconnect();

    expect(socket.disconnect).toHaveBeenCalled();
    expect(() => SocketService.getSocket()).toThrow();
  });

  it('tolerates disconnect() without an open connection', () => {
    expect(() => SocketService.disconnect()).not.toThrow();
  });
});
