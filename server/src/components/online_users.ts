import { Server, Socket } from 'socket.io';
import { MsgTypeOutbound } from '../shared/config/enums';

/** User ID of every authenticated socket, keyed by socket ID. */
const userIdBySocket = new Map<string, number>();

/**
 * Number of unique logged-in users, independent of the scene they are in (lobby, matchmaking or
 * running match). A user with several authenticated sockets counts once, unauthenticated
 * connections do not count.
 */
export function onlineUserCount(): number {
  return new Set(userIdBySocket.values()).size;
}

/**
 * Marks the user of a freshly authenticated socket as online and pushes the new count: to all
 * clients if the count changed, otherwise only to the socket itself, which still needs to learn
 * the current count.
 * @param io Socket.IO server to broadcast on
 * @param socket authenticated socket
 * @param userId user the socket logged in as
 */
export function markOnline(io: Server, socket: Socket, userId: number): void {
  const countBefore = onlineUserCount();
  userIdBySocket.set(socket.id, userId);
  const count = onlineUserCount();
  if (count != countBefore) {
    io.emit(MsgTypeOutbound.OnlineCount, count);
  } else {
    socket.emit(MsgTypeOutbound.OnlineCount, count);
  }
}

/**
 * Removes a disconnected socket from the online tracking and pushes the new count to all
 * clients if the user has no other authenticated socket left. Sockets which never logged in are
 * ignored.
 * @param io Socket.IO server to broadcast on
 * @param socket socket which disconnected
 */
export function markOffline(io: Server, socket: Socket): void {
  const countBefore = onlineUserCount();
  userIdBySocket.delete(socket.id);
  const count = onlineUserCount();
  if (count != countBefore) {
    io.emit(MsgTypeOutbound.OnlineCount, count);
  }
}

/** Clears the online tracking, for test isolation. */
export function resetOnlineUsers(): void {
  userIdBySocket.clear();
}
