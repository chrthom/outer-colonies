import io, { Socket } from 'socket.io-client';
import { environment } from '../environments/environment';

/**
 * App-level owner of the Socket.IO connection to the game server.
 *
 * Scenes must not create sockets themselves. The service guarantees that at
 * most one connection is alive at any time: opening a new connection for a
 * matchmaking session disconnects the socket of the previous match, which
 * would otherwise linger in its server-side match room until page reload.
 */
export default class SocketService {
  private static socket?: Socket;

  /**
   * Opens a new connection for a matchmaking session and returns it.
   *
   * A connection from a previous session is disconnected first, so that
   * exactly one live socket connection exists per client at any time.
   */
  static connect(): Socket {
    SocketService.disconnect();
    SocketService.socket = SocketService.createSocket();
    return SocketService.socket;
  }

  /**
   * Returns the current connection.
   *
   * @throws When no connection was opened via connect() yet.
   */
  static getSocket(): Socket {
    if (!SocketService.socket) {
      throw new Error('No socket connection opened');
    }
    return SocketService.socket;
  }

  /**
   * Disconnects the current connection, if one exists.
   */
  static disconnect(): void {
    SocketService.socket?.disconnect();
    SocketService.socket = undefined;
  }

  /**
   * Creates a socket with the matchmaking reconnection behaviour.
   *
   * Separated from connect() so that tests can inject a fake socket.
   */
  private static createSocket(): Socket {
    return io(environment.urls.api, { reconnectionAttempts: 5 });
  }
}
