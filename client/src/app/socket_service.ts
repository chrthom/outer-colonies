import { Injectable, OnDestroy } from '@angular/core';
import { MatchmakingStatus, MsgTypeInbound, MsgTypeOutbound, TurnPhase } from '@shared/config/enums';
import ClientGameParams from '@shared/interfaces/client_game_params';
import ClientPlannedBattle from '@shared/interfaces/client_planned_battle';
import { ClientState } from '@shared/interfaces/client_state';
import { Observable, Subject } from 'rxjs';
import io, { Socket } from 'socket.io-client';
import { environment } from '../environments/environment';

/** Typed payload emitted for `MsgTypeOutbound.Matchmaking`. */
export interface MatchmakingEvent {
  status: MatchmakingStatus;
  payload: ClientGameParams | number;
}

/** Typed payload emitted for `MsgTypeOutbound.Countdown`. */
export interface CountdownEvent {
  countdown: number;
  isPlayerActive: boolean;
}

/**
 * App-level Angular service owning the single Socket.IO connection to the game server
 * and exposing typed inbound/outbound streams.
 *
 * Scenes and components must not create sockets or register Socket.IO listeners
 * themselves. Opening a new connection for a matchmaking session disconnects the
 * socket of any previous session first so that at most one live connection exists
 * per client at any time.
 */
@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket?: Socket;
  private cleanupListeners?: () => void;

  private readonly connectSubject = new Subject<void>();
  private readonly disconnectSubject = new Subject<void>();
  private readonly connectErrorSubject = new Subject<void>();
  private readonly reconnectFailedSubject = new Subject<void>();
  private readonly matchmakingSubject = new Subject<MatchmakingEvent>();
  private readonly onlineCountSubject = new Subject<number>();
  private readonly stateSubject = new Subject<ClientState>();
  private readonly countdownSubject = new Subject<CountdownEvent>();

  /** Fires whenever the underlying socket establishes or re-establishes a connection. */
  readonly connect$: Observable<void> = this.connectSubject.asObservable();
  /** Fires whenever the underlying socket disconnects. */
  readonly disconnect$: Observable<void> = this.disconnectSubject.asObservable();
  /** Fires on socket connection errors. */
  readonly connectError$: Observable<void> = this.connectErrorSubject.asObservable();
  /** Fires when Socket.IO exhausts all matchmaking reconnection attempts. */
  readonly reconnectFailed$: Observable<void> = this.reconnectFailedSubject.asObservable();
  /** Fires on matchmaking status updates from the server. */
  readonly matchmaking$: Observable<MatchmakingEvent> = this.matchmakingSubject.asObservable();
  /** Fires when the server broadcasts the current online player count. */
  readonly onlineCount$: Observable<number> = this.onlineCountSubject.asObservable();
  /** Fires whenever the server pushes a new game state. */
  readonly state$: Observable<ClientState> = this.stateSubject.asObservable();
  /** Fires on turn countdown ticks from the server. */
  readonly countdown$: Observable<CountdownEvent> = this.countdownSubject.asObservable();

  /**
   * Opens a new connection for a matchmaking session, wires typed outbound streams,
   * and returns the underlying socket.
   *
   * Any previous connection is disconnected and its listeners are cleaned up first,
   * preserving the single-socket guarantee.
   */
  connect(): Socket {
    this.disconnect();
    const socket = this.createSocket();
    this.socket = socket;
    this.cleanupListeners = this.bindSocketListeners(socket);
    return socket;
  }

  /**
   * Returns the current socket connection.
   *
   * @throws When no connection was opened via `connect()` yet.
   */
  getSocket(): Socket {
    if (!this.socket) {
      throw new Error('No socket connection opened');
    }
    return this.socket;
  }

  /**
   * Whether a socket connection is currently open.
   */
  hasSocket(): boolean {
    return this.socket !== undefined;
  }

  /**
   * Disables automatic Socket.IO reconnection on the active match socket.
   * Mid-game rejoins are handled via a fresh page load rather than socket auto-reconnect.
   */
  disableReconnection(): void {
    this.socket?.io?.reconnection(false);
  }

  /**
   * Removes all bound Socket.IO listeners and disconnects the current connection, if any.
   */
  disconnect(): void {
    this.cleanupListeners?.();
    this.cleanupListeners = undefined;
    this.socket?.disconnect();
    this.socket = undefined;
  }

  /**
   * Sends the player's session token to authenticate the socket connection.
   */
  emitLogin(sessionToken: string): void {
    this.getSocket().emit(MsgTypeInbound.Login, sessionToken);
  }

  /**
   * Signals phase readiness (init, build battle/intercept selection, combat, or intervention skip).
   */
  emitReady(turnPhase: TurnPhase, payload?: ClientPlannedBattle | string[]): void {
    if (payload !== undefined) {
      this.getSocket().emit(MsgTypeInbound.Ready, turnPhase, payload);
    } else {
      this.getSocket().emit(MsgTypeInbound.Ready, turnPhase);
    }
  }

  /**
   * Plays a hand card onto a target stack, optionally with selected option card IDs.
   */
  emitHandcard(handCardUUID: string, targetUUID: string, selectedOptions?: number[]): void {
    if (selectedOptions !== undefined) {
      this.getSocket().emit(MsgTypeInbound.Handcard, handCardUUID, targetUUID, selectedOptions);
    } else {
      this.getSocket().emit(MsgTypeInbound.Handcard, handCardUUID, targetUUID);
    }
  }

  /**
   * Discards an excess hand card during the end phase.
   */
  emitDiscard(cardUUID: string): void {
    this.getSocket().emit(MsgTypeInbound.Discard, cardUUID);
  }

  /**
   * Executes a combat attack from a stack/weapon card onto a target stack.
   */
  emitAttack(stackUUID: string, cardUUID: string, targetUUID: string): void {
    this.getSocket().emit(MsgTypeInbound.Attack, stackUUID, cardUUID, targetUUID);
  }

  /**
   * Retracts a card from a board stack back to the player's hand.
   */
  emitRetract(stackUUID: string, cardUUID: string): void {
    this.getSocket().emit(MsgTypeInbound.Retract, stackUUID, cardUUID);
  }

  /**
   * Surrenders the current match.
   */
  emitSurrender(): void {
    this.getSocket().emit(MsgTypeInbound.Surrender);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  /**
   * Creates a socket with the matchmaking reconnection behaviour.
   *
   * Separated from `connect()` so that tests can inject a fake socket.
   */
  protected createSocket(): Socket {
    return io(environment.urls.api, { reconnectionAttempts: 5 });
  }

  private bindSocketListeners(socket: Socket): () => void {
    const onConnect = () => this.connectSubject.next();
    const onDisconnect = () => this.disconnectSubject.next();
    const onConnectError = () => this.connectErrorSubject.next();
    const onReconnectFailed = () => this.reconnectFailedSubject.next();
    const onMatchmaking = (status: MatchmakingStatus, payload: ClientGameParams | number) =>
      this.matchmakingSubject.next({ status, payload });
    const onOnlineCount = (count: number) => this.onlineCountSubject.next(count);
    const onState = (state: ClientState) => this.stateSubject.next(state);
    const onCountdown = (countdown: number, isPlayerActive: boolean) =>
      this.countdownSubject.next({ countdown, isPlayerActive });

    socket.on(MsgTypeOutbound.Connect, onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on(MsgTypeOutbound.Matchmaking, onMatchmaking);
    socket.on(MsgTypeOutbound.OnlineCount, onOnlineCount);
    socket.on(MsgTypeOutbound.State, onState);
    socket.on(MsgTypeOutbound.Countdown, onCountdown);
    socket.io?.on('reconnect_failed', onReconnectFailed);

    return () => {
      socket.off(MsgTypeOutbound.Connect, onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off(MsgTypeOutbound.Matchmaking, onMatchmaking);
      socket.off(MsgTypeOutbound.OnlineCount, onOnlineCount);
      socket.off(MsgTypeOutbound.State, onState);
      socket.off(MsgTypeOutbound.Countdown, onCountdown);
      socket.io?.off('reconnect_failed', onReconnectFailed);
    };
  }
}
