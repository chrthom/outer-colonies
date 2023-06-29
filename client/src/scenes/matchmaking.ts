import io, { Socket } from 'socket.io-client';
import Background from '../components/background';
import LoadingStatus from '../components/loading_status';

export default class Matchmaking extends Phaser.Scene {
    playerName: string;
    status: LoadingStatus;
    socket: Socket;

    constructor () {
        super({
            key: 'Matchmaking'
        });
    }

    preload () {
        this.load.baseURL = 'http://localhost:3000/cardimages/';
        this.load.image('background', `background/stars${Math.floor(Math.random() * 7)}.jpg`);
    }

    create () {
        this.playerName = window.location.search.substring(1);
        this.status = new LoadingStatus(this);
        this.socket = io('http://localhost:3000');
        this.socket.on('connect', () => {
            this.status.setText('Mit Matchmaking Server verbunden')
            this.socket.emit('login', this.playerName);
        });
        this.socket.on('matchmaking', (status, params) => {
            switch(status) {
                case 'search':
                    this.status.setText('Suche Gegner...\nDerzeit mit ' + params + ' anderen Spielern im Matchmaking');
                    break;
                case 'start':
                    this.socket.off('connect');
                    this.socket.off('matchmaking');
                    this.scene.start('Game', {
                        socket: this.socket,
                        gameParams: params
                    });
                    break;
            }
        });
        new Background(this);
    }

    update () {}
}