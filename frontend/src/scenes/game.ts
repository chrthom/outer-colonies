import { Socket } from 'socket.io-client';
import Button from '../components/button';
import Prompt from '../components/prompt';
import { FrontendState } from '../../../backend/src/components/frontend_converters/frontend_state';
import { BattleType, MsgTypeInbound, TurnPhase } from '../../../backend/src/components/config/enums';
import HandCard from '../components/card/hand_card';
import CardStack from '../components/card/card_stack';
import DeckCard from '../components/card/deck_card';
import MaxCard from '../components/card/max_card';
import { rules } from '../../../backend/src/components/config/rules';
import { FrontendPlannedBattle } from '../../../backend/src/components/frontend_converters/frontend_planned_battle';
import DiscardPile from '../components/card/discard_pile';
import ActionPool from '../components/action_pool';

class InitData {
    socket: Socket;
}

export default class Game extends Phaser.Scene {
    socket: Socket;
    state: FrontendState;
    activeHandCard: string;
    activeCardStack: string;
    activeCardStackIndex: number;
    plannedBattle: FrontendPlannedBattle;
    interveneShipIds: Array<string> = [];
    hand: Array<HandCard> = [];
    cardStacks: Array<CardStack> = [];
    obj = {
        actionPool: null,
        button: null,
        deck: null,
        discardPile: null,
        prompt: null,
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
        [ // TODO: Determine cards to preload based on player decks
            0, 1, 130, 135, 141, 160, 163, 166, 170, 185, 232, 242, 348, 350, 453
        ].forEach(id => this.load.image(`card_${id}`, `http://localhost:3000/cardimages/${id}.png`));
        [ 
            'equipment', 'hull', 'infrastructure', 'orb', 'tactic', 
            'armour_1', 'armour_2', 'armour_3', 'shield_1', 'shield_2', 'point_defense_1', 'point_defense_2'
        ].forEach(name => this.load.image(`icon_${name}`, `http://localhost:3000/cardimages/icons/${name}.png`));
    }
    
    create () {
        let self = this;
        this.socket.on('state', (state: FrontendState) => {
            this.updateState(state);
        });
        this.obj.actionPool = new ActionPool(this);
        this.obj.button = new Button(this);
        this.obj.deck = new DeckCard(this);
        this.obj.discardPile = new DiscardPile(this, [])
        this.obj.prompt = new Prompt(this);
        this.obj.maxCard = new MaxCard(this);
        this.socket.emit(MsgTypeInbound.Ready, TurnPhase.Init);
    }

    update() {}

    updateState(state: FrontendState) {
        this.state = state;
        this.recreateCards();
        this.resetSelections();
    }

    recreateCards() {
        const self = this;
        self.hand.forEach(c => c.destroy());
        self.hand = self.state.hand.map(cardData => new HandCard(self, self.state.hand.length, cardData));
        self.cardStacks.forEach(cs => cs.destroy());
        self.state.cardStacks.forEach(cs => self.cardStacks.push(new CardStack(self, cs)));
        self.obj.discardPile.destroy();
        self.obj.discardPile = new DiscardPile(self, self.state.discardPileIds);
    }

    resetSelections() {
        this.resetWithBattleType(BattleType.None);
    }

    resetWithBattleType(type: BattleType) {
        this.activeHandCard = null;
        this.activeCardStack = null;
        this.activeCardStackIndex = null;
        this.interveneShipIds = [];
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
        this.obj.actionPool.update(this);
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
            } else if (this.activeHandCard
                    || (this.state.turnPhase == TurnPhase.Build && !this.state.playerIsActive)
                    || this.state.turnPhase == TurnPhase.Combat) {
                this.obj.deck.highlightDisabled();
            }
            this.hand.forEach(c => {
                if (this.plannedBattle.type != BattleType.None) c.highlightDisabled();
                else if (this.activeHandCard == c.uuid) c.highlightSelected();
                else c.highlightPlayability();
            });
            this.cardStacks.forEach(c => {
                if (this.activeHandCard) { // Choose target for hand card
                    const activeCard = this.hand.find(c => c.uuid == this.activeHandCard);
                    if (!activeCard.data.validTargets.includes(c.uuid)) c.highlightDisabled();
                } else {
                    switch (this.state.turnPhase) {
                        case TurnPhase.Build:
                            if (this.plannedBattle.type != BattleType.None) { // Assign ships for battle
                                if (c.isOpponentColony()) {
                                    if (this.plannedBattle.type == BattleType.Raid) c.highlightSelected();
                                } else {
                                    if (!c.data.missionReady) c.highlightDisabled();
                                    else if (this.plannedBattle.shipIds.includes(c.uuid)) c.highlightSelected();
                                }
                            } else if (this.state.battle.type != BattleType.None && !this.state.playerIsActive) { // Assign ships to intervene
                                if (!c.data.interventionReady) c.highlightDisabled();
                                else if (this.interveneShipIds.includes(c.uuid)) c.highlightSelected();
                            }
                            break;
                        case TurnPhase.Combat:
                            c.highlightDisabled();
                            if (this.activeCardStack == c.uuid) {
                                c.cards[this.activeCardStackIndex].highlightSelected();
                            } else if (this.state.battle.playerShipIds.includes(c.uuid)) {
                                c.data.battleReadyCardIndexes.forEach(i => c.cards[i].highlightReset());
                            }
                            if (this.activeCardStack && this.state.battle.opponentShipIds.includes(c.uuid)) c.highlightReset();
                            break;
                    }
                }
            });
        }
    }

    getCardStackByUUID(uuid: string) {
        return this.cardStacks.find(cs => cs.uuid == uuid);
    }
}