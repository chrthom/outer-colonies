import io, { Socket } from 'socket.io-client';

export default class Matchmaking extends Phaser.Scene {
    playerName: string;
    statusText: Phaser.GameObjects.Text;
    socket: Socket;
    

    constructor () {
        super({
            key: 'Matchmaking'
        });
    }

    preload () {}

    create () {
        let self = this;
        this.playerName = window.location.search.substring(1);
        this.statusText = this.add.text(100, 300, ['Hallo ' + this.playerName]).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#ffff99');
        this.socket = io('http://localhost:3000');
        this.socket.on('connect', () => {
        	console.log('Connected to backend!');
            self.socket.emit('login', self.playerName);
        });
        this.socket.on('matchmaking', (status, params) => {
            switch(status) {
                case 'search':
                    self.statusText.setText('Derzeit ' + params + ' andere Spieler im Matchmaking - suche nächstes Spiel...');
                    break;
                case 'start':
                    self.statusText.setText('Trete Spiel bei...');
                    this.socket.off('connect');
                    this.socket.off('matchmaking');
                    this.scene.start('Game', {
                        socket: self.socket,
                        gameParams: params
                    });
                    break;
            }
        });
    }

    update () {}
}