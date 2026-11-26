import { Injectable, OnDestroy, inject } from '@angular/core';
import { MatchmakingStatus } from '@shared/config/enums';
import ClientGameParams from '@shared/interfaces/client_game_params';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { SocketService } from '../socket_service';

/**
 * Renderer-agnostic matchmaking service owning session token parsing,
 * connection status text, online player count, and match start notifications.
 */
@Injectable({ providedIn: 'root' })
export class MatchmakingService implements OnDestroy {
  private readonly statusTextSubject = new BehaviorSubject<string>('Verbinde mit Server...');
  private readonly onlineCountSubject = new BehaviorSubject<number | undefined>(undefined);
  private readonly matchStartSubject = new Subject<ClientGameParams>();

  /** Localized status message for the matchmaking loading display. */
  readonly statusText$: Observable<string> = this.statusTextSubject.asObservable();
  /** Current number of unique online players, or `undefined` before the first update. */
  readonly onlineCount$: Observable<number | undefined> = this.onlineCountSubject.asObservable();
  /** Emits game startup parameters once the server assigns a match. */
  readonly matchStart$: Observable<ClientGameParams> = this.matchStartSubject.asObservable();

  private readonly socketService = inject(SocketService);

  private sessionToken = '';
  private subscriptions?: Subscription;

  /** Current matchmaking status text. */
  get statusText(): string {
    return this.statusTextSubject.value;
  }

  /** Current online player count, if received. */
  get onlineCount(): number | undefined {
    return this.onlineCountSubject.value;
  }

  /** Session token parsed when matchmaking started. */
  get token(): string {
    return this.sessionToken;
  }

  /**
   * Parses the session token from a query string.
   *
   * Supports `?token=<session token>` and falls back to the legacy `?<session token>` format.
   *
   * @param search Query string to inspect (defaults to `window.location.search`).
   */
  parseSessionToken(search: string = window.location.search): string {
    const searchParams = new URLSearchParams(search);
    return searchParams.get('token') ?? (search.startsWith('?') ? search.substring(1) : search);
  }

  /**
   * Starts a matchmaking session: parses the token, opens a fresh socket connection,
   * and binds all matchmaking listeners.
   *
   * @param search Optional query string override for token extraction.
   */
  start(search?: string): void {
    this.stop();
    this.sessionToken = this.parseSessionToken(search);
    this.statusTextSubject.next('Verbinde mit Server...');
    this.onlineCountSubject.next(undefined);
    this.socketService.connect();

    const sub = new Subscription();
    sub.add(
      this.socketService.connect$.subscribe(() => {
        this.statusTextSubject.next('Authentifiziere Nutzer...');
        this.socketService.emitLogin(this.sessionToken);
      })
    );
    sub.add(
      this.socketService.disconnect$.subscribe(() => {
        this.statusTextSubject.next('Verbindung verloren. Versuche erneut...');
      })
    );
    sub.add(
      this.socketService.connectError$.subscribe(() => {
        this.statusTextSubject.next('Verbindung verloren. Versuche erneut...');
      })
    );
    sub.add(
      this.socketService.reconnectFailed$.subscribe(() => {
        this.statusTextSubject.next('Verbindung fehlgeschlagen. Bitte Seite neu laden.');
      })
    );
    sub.add(
      this.socketService.matchmaking$.subscribe(({ status, payload }) => {
        switch (status) {
          case MatchmakingStatus.Search:
            this.statusTextSubject.next('Suche Mitspieler...');
            break;
          case MatchmakingStatus.Start:
            this.matchStartSubject.next(payload as ClientGameParams);
            break;
        }
      })
    );
    sub.add(
      this.socketService.onlineCount$.subscribe(count => {
        this.onlineCountSubject.next(count);
      })
    );
    this.subscriptions = sub;
  }

  /**
   * Unsubscribes matchmaking listeners while keeping the socket alive so the
   * game session can take over the connection when a match starts.
   */
  stop(): void {
    this.subscriptions?.unsubscribe();
    this.subscriptions = undefined;
    this.onlineCountSubject.next(undefined);
  }

  /**
   * Cancels matchmaking and disconnects the socket connection.
   */
  cancel(): void {
    this.stop();
    this.socketService.disconnect();
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
