import Card from '../components/card';

export default class Game extends Phaser.Scene {
    state = {};
    hand = [];
    obj = {
        deck: null
    };

    constructor () {
        super({
            key: 'Game'
        });
    }

    init(data) {
        this.socket = data.socket;
    }

    preload () {
        [ 'back', 130, 160, 163, 166, 348].forEach(id => this.load.image(`card_${id}`, `src/assets/cards/${id}.png`));
    }
    
    create () {
        let self = this;

        this.socket.on('state', (state) => {
            this.updateState(state);
        });

        this.socket.emit('ready');

        // Sample objects for testing

        this.obj.deck = new Card(this, 1150, 620, 'back');

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
            //let card = new Card(this);
            //card.render(300, 600, 'card_back');
        }
        this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
            gameObject.x = dragX;
            gameObject.y = dragY;
        })
    }

    update() {}

    updateState(state) {
        this.state = state;
        //console.log('Received new state: ' + JSON.stringify(state)); //
        this.hand.forEach(card => card.sprite.destroy());
        this.hand = state.hand.map((card, index) => {
            const x = 70 + (state.hand.length <= 8 ? index * 125 : index * 1000 / state.hand.length);
            return new Card(this, x, 620, card.id);
        });
    }
}