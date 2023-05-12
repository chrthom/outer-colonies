import { Socket } from 'socket.io-client';
import Button from '../components/button';
import Prompt from '../components/prompt';
import { FrontendState } from '../../../backend/src/components/frontend_converters/frontend_state';
import { BattleType, MsgTypeInbound, TurnPhase } from '../../../backend/src/components/config/enums';
import HandCard from '../components/card/hand_card';
import CardStack from '../components/card/card_stack';
import DeckCard from '../components/card/deck_card';
import MaxCard from '../components/card/max_card';
import { consts } from '../../../backend/src/components/config/consts';
import { rules } from '../../../backend/src/components/config/rules';
import { FrontendPlannedBattle } from '../../../backend/src/components/frontend_converters/frontend_planned_battle';

class InitData {
    socket: Socket;
}

export default class Game extends Phaser.Scene {
    socket: Socket;
    state: FrontendState;
    activeCard: string;
    plannedBattle: FrontendPlannedBattle;
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

    updateState(state: FrontendState) {
        const self = this;
        self.state = state;
        this.recreateCards();
        this.resetPlannedBattle(BattleType.None);
    }

    recreateCards() {
        const self = this;
        self.hand.forEach(c => c.destroy());
        self.hand = self.state.hand.map(cardData => new HandCard(self, self.state.hand.length, cardData));
        self.cardStacks.forEach(cs => cs.destroy());
        self.state.cardStacks.forEach(cs => self.cardStacks.push(new CardStack(self, cs)));
    }

    resetPlannedBattle(type: BattleType) {
        this.activeCard = null;
        this.plannedBattle = {
            type: type,
            downsideCardsNum: 0,
            upsideCardsIndex: [], // TODO: Implement later
            shipIds: []
        }
        if (type == BattleType.Mission)
            this.plannedBattle.downsideCardsNum = rules.cardsPerMission; // TODO: Add feature to also allow upside cards from discard pile
        this.updateView();
    }

    updateView() {
        this.obj.button.update(this);
        this.obj.prompt.update(this);
        this.updateHighlighting();
    }

    updateHighlighting() {
        this.obj.deck.highlightReset();
        this.hand.forEach(c => c.highlightReset());
        this.cardStacks.forEach(c => c.highlightReset());
        if (this.state.playerPendingAction) {
            if (this.plannedBattle.type == BattleType.Mission) {
                this.obj.deck.highlightSelected();
            } else if (this.activeCard) {
                this.obj.deck.highlightDisabled();
            }
            this.hand.forEach(c => {
                if (this.plannedBattle.type != BattleType.None) c.highlightDisabled();
                else if (this.activeCard == c.uuid) c.highlightSelected();
                else c.highlightPlayability();
            });
            const activeCard = this.hand.find(c => c.uuid == this.activeCard);
            this.cardStacks.forEach(c => {
                if (this.plannedBattle.type != BattleType.None) {
                    if (c.uuid == consts.colonyOpponent) {
                        if (this.plannedBattle.type == BattleType.Raid) {
                            c.highlightSelected();
                        }
                    } else {
                        if (!c.data.missionReady) {
                            c.highlightDisabled();
                        } else if (this.plannedBattle.shipIds.includes(c.uuid)) {
                            c.highlightSelected();
                        }
                    }
                } else if (this.activeCard) {
                    if (!activeCard.data.validTargets.includes(c.uuid)) c.highlightDisabled();
                }
            })
        }
    }

    getCardStackByUUID(uuid: string) {
        return this.cardStacks.find(cs => cs.uuid == uuid);
    }
}