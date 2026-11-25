import { Socket } from 'socket.io-client';
import Background from '../components/background';
import LoadingStatus from '../components/loading_status';
import { MatchmakingStatus, MsgTypeInbound, MsgTypeOutbound } from '@shared/config/enums';
import VersionIndicator from '../components/indicators/version_indicator';
import OnlineIndicator from '../components/indicators/online_indicator';
import Phaser from 'phaser';
import ExitButton from '../components/buttons/exit_button';
import BotButton from '../components/buttons/bot_button';
import { loadPreloadableResources, loadRequiredResources } from './resource-loader';
import ClientGameParams from '@shared/interfaces/client_game_params';
import SocketService from '../socket_service';

export default class Matchmaking extends Phaser.Scene {
  sessionToken!: string;
  status!: LoadingStatus;
  onlineIndicator!: OnlineIndicator;
  socket!: Socket;

  constructor() {
    super({
      key: 'Matchmaking'
    });
  }

  preload() {
    loadRequiredResources(this.load);
  }

  create() {
    // The website opens the client with `?token=<session token>` (see the website home page).
    // Fall back to the whole query string to support the legacy `?<session token>` format.
    const searchParams = new URLSearchParams(window.location.search);
    this.sessionToken = searchParams.get('token') ?? window.location.search.substring(1);
    this.status = new LoadingStatus(this);
    new VersionIndicator(this);
    this.onlineIndicator = new OnlineIndicator(this);
    new ExitButton(this);
    new BotButton(this);
    this.socket = SocketService.connect();
    this.registerSocketListeners();
    new Background(this);
    loadPreloadableResources(this.load);
  }

  /**
   * Registers the socket listeners of the matchmaking scene.
   *
   * All listeners are bound to the scene lifecycle and removed again on scene
   * shutdown, so that no listeners of a previous session leak into the next
   * matchmaking or game scene.
   */
  private registerSocketListeners(): void {
    this.socket.on(MsgTypeOutbound.Connect, () => {
      this.status.setText('Authentifiziere Nutzer...');
      this.socket.emit(MsgTypeInbound.Login, this.sessionToken);
    });
    this.socket.on('disconnect', () => {
      this.status.setText('Verbindung verloren. Versuche erneut...');
    });
    this.socket.on('connect_error', () => {
      this.status.setText('Verbindung verloren. Versuche erneut...');
    });
    this.socket.io.on('reconnect_failed', () => {
      this.status.setText('Verbindung fehlgeschlagen. Bitte Seite neu laden.');
    });
    this.socket.on(
      MsgTypeOutbound.Matchmaking,
      (status: MatchmakingStatus, payload: ClientGameParams | number) => {
        switch (status) {
          case MatchmakingStatus.Search:
            // The server reports the number of waiting clients, which is not displayed.
            this.status.setText('Suche Mitspieler...');
            break;
          case MatchmakingStatus.BotRejected:
            this.status.setText('Bot-Spiel konnte nicht gestartet werden. Suche Mitspieler...');
            break;
          case MatchmakingStatus.Start:
            // The game scene fetches the connection from the SocketService itself.
            // Only the Start message carries game params; Search reports the waiting-client count.
            this.scene.start('Game', {
              gameParams: payload as ClientGameParams
            });
            break;
        }
      }
    );
    this.socket.on(MsgTypeOutbound.OnlineCount, (count: number) => {
      this.onlineIndicator.setCount(count);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.socket.off(MsgTypeOutbound.Connect);
      this.socket.off(MsgTypeOutbound.OnlineCount);
      this.socket.off(MsgTypeOutbound.Matchmaking);
      this.socket.off('disconnect');
      this.socket.off('connect_error');
      this.socket.io.off('reconnect_failed');
    });
  }

  /**
   * Cancels the opponent search and starts a singleplayer game against the
   * bot. The server emits the regular matchmaking start message, so the
   * transition to the game scene works exactly like in a human match.
   */
  startBotGame() {
    this.status.setText('Starte Bot-Spiel...');
    this.socket.emit(MsgTypeInbound.StartBotGame);
  }
}
