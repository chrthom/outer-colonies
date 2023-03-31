import Card from '../components/card';
import io from 'socket.io-client';

export default class Game extends Phaser.Scene {
    constructor () {
        super({
            key: 'Game'
        });
    }

    init(data) {
        this.socket = data.socket;
    }

    preload () {
        this.load.image('card_back', 'src/assets/cards/back_side.png');
    }
    
    create () {
        let self = this;

        this.socket.emit('ready');

        // Sample objects for testing

        this.playerDeck = this.add.image(1050, 600, 'card_back').setScale(0.1, 0.1);
        this.opponentDeck = this.add.image(1050, 100, 'card_back').setScale(0.1, 0.1);

        this.dealText = this.add.text(50, 600, ['Start']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.dealText.on('pointerdown', function () {
            self.dealCards();
        })

        this.dealText.on('pointerover', function () {
            self.dealText.setColor('#ff69b4');
        })

        this.dealText.on('pointerout', function () {
            self.dealText.setColor('#00ffff');
        })
		this.dealCards = () => {
            let card = new Card(this);
            card.render(300, 600, 'card_back');
        }

        this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
            gameObject.x = dragX;
            gameObject.y = dragY;
        })
    }

    update() {}
}