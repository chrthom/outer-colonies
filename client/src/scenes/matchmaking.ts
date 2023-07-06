import io, { Socket } from 'socket.io-client';
import Background from '../components/background';
import LoadingStatus from '../components/loading_status';
import { MsgTypeInbound, MsgTypeOutbound } from '../../../server/src/components/config/enums';
import VersonIndicator from '../components/indicators/version_indicator';

export default class Matchmaking extends Phaser.Scene {
    sessionToken: string;
    status: LoadingStatus;
    socket: Socket;

    constructor() {
        super({
            key: 'Matchmaking'
        });
    }

    preload() {
        this.load.baseURL = 'https://api.outercolonies.thomsen.in/assets/';
        this.load.image('background', `background/stars${Math.floor(Math.random() * 7)}.jpg`);
    }

    create() {
        this.sessionToken = window.location.search.substring(1);
        this.status = new LoadingStatus(this);
        new VersonIndicator(this);
        this.socket = io('https://api.outercolonies.thomsen.in');
        this.socket.on(MsgTypeOutbound.Connect, () => {
            this.status.setText('Authentifiziere Nutzer...')
            this.socket.emit(MsgTypeInbound.Login, this.sessionToken);
        });
        this.socket.on(MsgTypeOutbound.Matchmaking, (status, params) => {
            switch(status) {
                case 'search':
                    this.status.setText('Suche Gegner...\nDerzeit mit ' + params + ' anderen Spielern im Matchmaking');
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
    }

    update() {}
}