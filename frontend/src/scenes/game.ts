import { Socket } from 'socket.io-client';
import Button from '../components/button';
import Prompt from '../components/prompt';
import { FrontendState } from '../../../backend/src/components/frontend_converters/frontend_state';
import { MsgTypeInbound, TurnPhase } from '../../../backend/src/components/config/enums';
import PlannedBattle from '../data/planned_battle';
import HandCard from '../components/card/hand_card';
import CardStack from '../components/card/card_stack';
import DeckCard from '../components/card/deck_card';
import MaxCard from '../components/card/max_card';
import { consts } from '../../../backend/src/components/config/consts';
import { rules } from '../../../backend/src/components/config/rules';

class InitData {
    socket: Socket;
}

export default class Game extends Phaser.Scene {
    socket: Socket;
    state: FrontendState;
    activeCard: string;
    plannedBattle: PlannedBattle;
    hand: Array<HandCard> = [];
    cardStacks: Array<CardStack> = [];
    obj = {
        deck: null,
        prompt: null,
        button: null,
        maxCard: null
    };

    constructor () {
        super({
            key: 'Game'
        });
    }

    init(data: InitData) {
        this.socket = data.socket;
    }

    preload () {
        [ 'back', 'colony', 130, 160, 163, 166, 348].forEach(id => // TODO: Determine cards to preload based on player decks
            this.load.image(`card_${id}`, `http://localhost:3000/cardimages/${id}.png`));
    }
    
    create () {
        let self = this;
        this.socket.on('state', (state: FrontendState) => {
            this.updateState(state);
        });
        this.obj.deck = new DeckCard(this);
        this.obj.prompt = new Prompt(this);
        this.obj.button = new Button(this);
        this.obj.maxCard = new MaxCard(this);
        this.socket.emit(MsgTypeInbound.Ready, TurnPhase.Init);
    }

    update() {}

    nextPhase = () => {
        console.log(`Completed ${this.state.turnPhase} phase`);
        this.socket.emit(MsgTypeInbound.Ready, this.state.turnPhase);
    }

    updateState(state: FrontendState) {
        let self = this;
        self.state = state;
        //console.log('Received new state: ' + JSON.stringify(state)); //
        /// Reset temp states
        self.activeCard = null;
        self.plannedBattle = {
            type: null,
            downsideCardsNum: 0,
            upsideCardsIndex: [], // TODO: Implement later
            shipIds: []
        }
        /// Reload hand cards
        self.hand.forEach(c => c.destroy());
        self.hand = state.hand.map(cardData => {
            return new HandCard(self, state.hand.length, cardData);
        });
        /// Reload Card Stacks
        self.cardStacks.forEach(cs => cs.destroy());
        self.state.cardStacks.forEach(cs => 
            self.cardStacks.push(new CardStack(self, cs)));
        /// Reset other objects
        self.obj.prompt.hide();
        self.obj.button.hide();
        /// Set visibility based on phase
        if (state.playerIsActive) {
            switch (state.turnPhase) {
                case TurnPhase.Build:
                    self.hand.forEach(c => c.highlightPlayability());
                    self.obj.prompt.showBuildPhase(self.state.remainingActions);
                    break;
                case TurnPhase.Plan:
                    self.hand.forEach(c => c.highlightDisabled());
                    this.resetPlannedBattle(null);
                    break;
            }
            if ([TurnPhase.Build, TurnPhase.Plan].includes(state.turnPhase))
                self.obj.button.showPhase(state.turnPhase, self.nextPhase);
        }
    }

    getCardStackByUUID(uuid: string) {
        return this.cardStacks.find(cs => cs.uuid == uuid);
    }

    resetPlannedBattle(type: string) {
        this.plannedBattle = {
            type: type,
            downsideCardsNum: 0,
            upsideCardsIndex: [], // TODO: Implement later
            shipIds: []
        }
        this.cardStacks.filter(c => c.uuid != consts.colonyOpponent).forEach(c => {
            if (c.uuid == consts.colonyOpponent) c.highlightReset();
            else c.highlightMissionReady();
        });
        this.obj.deck.highlightReset();
        if (type == 'mission')
            this.plannedBattle.downsideCardsNum = rules.cardsPerMission; // TODO: Add feature to also allow upside cards from discard pile
        this.obj.prompt.showPlanPhase(this.plannedBattle);
    }
}