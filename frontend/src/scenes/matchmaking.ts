import io, { Socket } from 'socket.io-client';
import Background from '../components/background';
import { layout } from '../config/layout';

export default class Matchmaking extends Phaser.Scene {
    playerName: string;
    statusText: Phaser.GameObjects.Text;
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
        this.statusText = this.add
            .text(100, 300, ['Hallo ' + this.playerName])
            .setFontSize(layout.font.size)
            .setFontFamily(layout.font.family)
            .setColor(layout.font.color);
        this.socket = io('http://localhost:3000');
        this.socket.on('connect', () => {
        	console.log('Connected to backend!');
            this.socket.emit('login', this.playerName);
        });
        this.socket.on('matchmaking', (status, params) => {
            switch(status) {
                case 'search':
                    this.statusText.setText('Derzeit ' + params + ' andere Spieler im Matchmaking - suche nächstes Spiel...');
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