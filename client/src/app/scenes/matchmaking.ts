import io, { Socket } from 'socket.io-client';
import Background from '../components/background';
import LoadingStatus from '../components/loading_status';
import {
  MatchmakingStatus,
  MsgTypeInbound,
  MsgTypeOutbound
} from '../../../../server/src/shared/config/enums';
import VersionIndicator from '../components/indicators/version_indicator';
import { environment } from '../../environments/environment';
import Phaser from 'phaser';
import ExitButton from '../components/buttons/exit_button';
import { loadPreloadableResources, loadRequiredResources } from './resource-loader';
import ClientGameParams from '../../../../server/src/shared/interfaces/client_game_params';

export default class Matchmaking extends Phaser.Scene {
  sessionToken!: string;
  status!: LoadingStatus;
  socket!: Socket;

  constructor() {
    super({
      key: 'Matchmaking'
    });
  }

  preload() {
    loadRequiredResources(environment.urls.api, this.load);
  }

  create() {
    // The website opens the client with `?token=<session token>` (see the website home page).
    // Fall back to the whole query string to support the legacy `?<session token>` format.
    const searchParams = new URLSearchParams(window.location.search);
    this.sessionToken = searchParams.get('token') ?? window.location.search.substring(1);
    this.status = new LoadingStatus(this);
    new VersionIndicator(this);
    new ExitButton(this);
    this.socket = io(environment.urls.api, { reconnectionAttempts: 5 });
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
          case MatchmakingStatus.Start:
            this.socket.off(MsgTypeOutbound.Connect);
            this.socket.off(MsgTypeOutbound.Matchmaking);
            this.socket.off('disconnect');
            this.socket.off('connect_error');
            this.socket.io.off('reconnect_failed');
            // Only the Start message carries game params; Search reports the waiting-client count.
            this.scene.start('Game', {
              socket: this.socket,
              gameParams: payload as ClientGameParams
            });
            break;
        }
      }
    );
    new Background(this);
    loadPreloadableResources(environment.urls.api, this.load); // Continue preloading
  }
}
