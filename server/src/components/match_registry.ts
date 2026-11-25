import Match from './game_state/match';
import Player from './game_state/player';

/**
 * A match the given user can rejoin at login, with the player they play in it.
 */
export interface RejoinableMatch {
  match: Match;
  player: Player;
}

/**
 * Registry of all matches which are currently running, whose disconnected
 * players may still reconnect within the grace window, or which have ended but
 * still owe a player the delivery of their game result.
 *
 * The registry decouples the match lifecycle from the socket.io rooms: socket.io
 * removes a room as soon as its last socket disconnects, so a match whose
 * players are both momentarily disconnected would no longer be discoverable via
 * the room. Keyed by the match room name, the registry keeps such matches alive
 * for the reconnection grace period and allows the game cron to end them once
 * it expires. Finished matches stay registered until every player received the
 * final state, so a player who was offline when the game ended can be shown the
 * missed result on their next login.
 */
const matchesByRoom = new Map<string, Match>();

/** Registers a newly created match so that it can be discovered for reconnection and by the game cron. */
export function registerMatch(match: Match): void {
  matchesByRoom.set(match.room, match);
}

/** Removes a finished match from the registry and stops any pending bot timer. */
export function unregisterMatch(match: Match): void {
  match.bot?.onMatchEnd();
  matchesByRoom.delete(match.room);
}

/** All registered matches, e.g. for the game cron. */
export function allActiveMatches(): Match[] {
  return Array.from(matchesByRoom.values());
}

/**
 * Returns the match the given user belongs to and can rejoin, with the player
 * they play in it, or undefined if the user has no such match.
 *
 * The lookup is keyed by the user behind the session token presented at login,
 * so a player reconnects with the same session token (or a fresh login of the
 * same account) within the grace window. A finished match whose final state
 * the player has not received yet is rejoinable as well, so the missed game
 * result can be delivered on their next login (see gameCron in
 * components/game.ts).
 */
export function findRejoinableMatch(userId: number): RejoinableMatch | undefined {
  for (const match of allActiveMatches()) {
    const player = match.players.find(p => p.userId == userId);
    if (player && (!match.gameResult.gameOver || !player.resultDelivered)) return { match, player };
  }
  return undefined;
}
