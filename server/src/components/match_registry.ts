import Match from './game_state/match';

/**
 * Registry of all matches which are currently running or whose disconnected
 * players may still reconnect within the grace window.
 *
 * The registry decouples the match lifecycle from the socket.io rooms: socket.io
 * removes a room as soon as its last socket disconnects, so a match whose
 * players are both momentarily disconnected would no longer be discoverable via
 * the room. Keyed by the match room name, the registry keeps such matches alive
 * for the reconnection grace period and allows the game cron to end them once
 * it expires.
 */
const matchesByRoom = new Map<string, Match>();

/** Registers a newly created match so that it can be discovered for reconnection and by the game cron. */
export function registerMatch(match: Match): void {
  matchesByRoom.set(match.room, match);
}

/** Removes a finished match from the registry. */
export function unregisterMatch(match: Match): void {
  matchesByRoom.delete(match.room);
}

/** All registered matches, e.g. for the game cron. */
export function allActiveMatches(): Match[] {
  return Array.from(matchesByRoom.values());
}

/**
 * Returns the running match the given user belongs to and can therefore rejoin,
 * or undefined if the user has no such match.
 *
 * The lookup is keyed by the user behind the session token presented at login,
 * so a player reconnects with the same session token (or a fresh login of the
 * same account) within the grace window.
 */
export function findRejoinableMatch(userId: number): Match | undefined {
  return allActiveMatches().find(m => !m.gameResult.gameOver && m.players.some(p => p.userId == userId));
}
