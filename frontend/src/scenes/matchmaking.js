import io from 'socket.io-client';

export default class Matchmaking extends Phaser.Scene {
    constructor () {
        super({
            key: 'Login'
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
                    self.statusText.setText('Trete Spiel bei: ' + params);
                    break;
            }
        });
    }

    update () {}
}