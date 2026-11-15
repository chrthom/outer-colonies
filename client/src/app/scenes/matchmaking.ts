import { Socket } from 'socket.io-client';
import Background from '../components/background';
import LoadingStatus from '../components/loading_status';
import { MsgTypeInbound, MsgTypeOutbound } from '../../../../server/src/shared/config/enums';
import VersionIndicator from '../components/indicators/version_indicator';
import { environment } from '../../environments/environment';
import Phaser from 'phaser';
import ExitButton from '../components/buttons/exit_button';
import { loadPreloadableResources, loadRequiredResources } from './resource-loader';
import SocketService from '../socket_service';

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
    this.sessionToken = window.location.search.substring(1);
    this.status = new LoadingStatus(this);
    new VersionIndicator(this);
    new ExitButton(this);
    // Disconnects the socket of a previous match before opening a new connection
    this.socket = SocketService.connect();
    this.registerSocketListeners();
    new Background(this);
    loadPreloadableResources(environment.urls.api, this.load); // Continue preloading
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
    this.socket.on(MsgTypeOutbound.Matchmaking, (status, params) => {
      switch (status) {
        case 'search':
          this.status.setText('Suche Mitspieler...');
          break;
        case 'start':
          // The game scene fetches the connection from the SocketService itself
          this.scene.start('Game', {
            gameParams: params
          });
          break;
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.socket.off(MsgTypeOutbound.Connect);
      this.socket.off(MsgTypeOutbound.Matchmaking);
      this.socket.off('disconnect');
      this.socket.off('connect_error');
      this.socket.io.off('reconnect_failed');
    });
  }
}
