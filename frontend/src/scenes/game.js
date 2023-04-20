import { Button } from '../components/button';
import { CardImage, CardStack, HandCard } from '../components/card';
import { Prompt } from '../components/prompt';

export default class Game extends Phaser.Scene {
    state = {};
    activeCard = null;
    hand = [];
    cardStacks = [];
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
        [ 'back', 'colony', 130, 160, 163, 166, 348].forEach(id => 
            this.load.image(`card_${id}`, `http://localhost:3000/cardimages/${id}.png`));
    }
    
    create () {
        let self = this;

        this.socket.on('state', (state) => {
            this.updateState(state);
        });

        this.obj.deck = new CardImage(this, 1050, 500, 'back');
        this.obj.prompt = new Prompt(this);
        this.obj.button = new Button(this);

        this.socket.emit('ready');
    }

    update() {}

    handCardClicked = (handCard) => {
        const reset = this.activeCard == handCard.uuid;
        this.activeCard = null;
        this.hand.forEach(c => c.highlightPlayability());
        this.cardStacks.forEach((cs) => cs.highlightReset());
        if (!reset) {
            this.activeCard = handCard.data.uuid;
            handCard.highlightSelected();
            this.cardStacks.forEach(cs => {
                if (!handCard.data.validTargets.includes(cs.uuid)) cs.highlightDisabled()
            });
        }
    }

    cardStackClicked = (cardStack) => {
        if (this.activeCard) this.socket.emit('handcard', this.activeCard, cardStack.uuid);
    }

    updateState(state) {
        let self = this;
        this.state = state;
        //console.log('Received new state: ' + JSON.stringify(state)); //
        this.activeCard = null;
        this.hand.forEach(c => c.destroy());
        this.hand = state.hand.map((cardData) => {
            return new HandCard(self, state.hand.length, cardData, self.handCardClicked);
        });
        this.cardStacks.forEach(c => c.destroy());
        this.state.cardStacks.forEach(cs => 
            self.cardStacks.push(new CardStack(
                self, cs.uuid, cs.cardIds, cs.zone, self.cardStackClicked, cs.index, cs.zoneCardsNum, cs.ownedByPlayer, cs.damage)));
        if (state.playerIsActive) {
            switch (state.turnPhase) {
                case 'build':
                    this.hand.forEach((c) => c.highlightPlayability());
                    const promptText = 'Aufbauphase: Spiele Karten\n'
                        + `${state.remainingActions.hull}x Hülle, `
                        + `${state.remainingActions.equipment}x Ausrüstung, `
                        + `${state.remainingActions.colony}x Kolonie, `
                        + `${state.remainingActions.tactic}x Taktik`
                    this.obj.prompt.showText(promptText)
                    this.obj.button.show('Aufbauphase beenden', () => {
                        console.log('Aufbauphase beendet'); // TODO: Implement
                    });
                    break;
            }
        }
    }

    getCardStackByUUID(uuid) {
        return this.cardStacks.find((cs) => cs.uuid == uuid);
    }
}