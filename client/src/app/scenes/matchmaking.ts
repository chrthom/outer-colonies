import io, { Socket } from 'socket.io-client';
import Background from '../components/background';
import LoadingStatus from '../components/loading_status';
import { MsgTypeInbound, MsgTypeOutbound } from '../../../../server/src/shared/config/enums';
import VersionIndicator from '../components/indicators/version_indicator';
import { environment } from '../../environments/environment';
import Phaser from 'phaser';
import ExitButton from '../components/buttons/exit_button';
import { loadPreloadableResources, loadRequiredResources } from './resource-loader';

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
    this.socket = io(environment.urls.api);
    this.socket.on(MsgTypeOutbound.Connect, () => {
      this.status.setText('Authentifiziere Nutzer...');
      this.socket.emit(MsgTypeInbound.Login, this.sessionToken);
    });
    this.socket.on(MsgTypeOutbound.Matchmaking, (status, params) => {
      switch (status) {
        case 'search':
          this.status.setText('Suche Mitspieler...');
          break;
        case 'start':
          this.socket.off(MsgTypeOutbound.Connect);
          this.socket.off(MsgTypeOutbound.Matchmaking);
          this.scene.start('Game', {
            socket: this.socket,
            gameParams: params
          });
          break;
      }
    });
    new Background(this);
    loadPreloadableResources(environment.urls.api, this.load); // Continue preloading
  }
}
