import { Button } from '../components/button';
import { CardImage, HandCard } from '../components/card';
import { Prompt } from '../components/prompt';

export default class Game extends Phaser.Scene {
    state = {};
    hand = [];
    obj = {
        deck: null,
        prompt: null,
        button: null
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
        [ 'back', 130, 160, 163, 166, 348].forEach(id => 
            this.load.image(`card_${id}`, `http://localhost:3000/cardimages/${id}.png`));
    }
    
    create () {
        let self = this;

        this.socket.on('state', (state) => {
            this.updateState(state);
        });

        this.obj.deck = new CardImage(this, 1150, 620, 'back');
        this.obj.prompt = new Prompt(this);
        this.obj.button = new Button(this);

        this.socket.emit('ready');
    }

    update() {}

    handCardClicked = (index) => {
        this.socket.emit('handcard', index);
    }

    updateState(state) {
        this.state = state;
        //console.log('Received new state: ' + JSON.stringify(state)); //
        this.hand.forEach(card => card.destroy());
        this.hand = state.hand.map((cardData) => {
            return new HandCard(this, state.hand.length, cardData, this.handCardClicked);
        });
        if (state.playerIsActive) {
            switch (state.turnPhase) {
                case 'build':
                    const promptText = 'Aufbauphase: Spiele Karten\n'
                        + `${state.remainingActions.hull}x Hülle, `
                        + `${state.remainingActions.equipment}x Ausrüstung, `
                        + `${state.remainingActions.colony}x Kolonie, `
                        + `${state.remainingActions.tactic}x Taktik`
                    this.obj.prompt.showText(promptText)
                    this.obj.button.show('Aufbauphase beenden', () => {
                        console.log('Weiter'); //
                    });
                    break;
            }
        }
    }
}