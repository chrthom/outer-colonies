import { Socket } from 'socket.io-client';
import Button from '../components/button';
import Prompt from '../components/prompt';
import { FrontendState } from '../../../backend/src/components/frontend_converters/frontend_state';
import { EventType as EventType, BattleType, MsgTypeInbound, MsgTypeOutbound, TurnPhase } from '../../../backend/src/components/config/enums';
import HandCard from '../components/card/hand_card';
import CardStack from '../components/card/card_stack';
import DeckCard from '../components/card/deck_card';
import MaxCard from '../components/card/max_card';
import { FrontendPlannedBattle } from '../../../backend/src/components/frontend_converters/frontend_planned_battle';
import { FrontendGameParams } from '../../../backend/src/components/frontend_converters/frontend_game_params';
import DiscardPile from '../components/card/discard_pile';
import ActionPool from '../components/action_pool';
import MissionCards from '../components/card/mission_cards';
import Preloader from '../components/preloader';

class InitData {
    socket: Socket;
    gameParams: FrontendGameParams;
}

export default class Game extends Phaser.Scene {
    socket: Socket;
    gameParams: FrontendGameParams;
    preloader: Preloader;
    state: FrontendState;
    oldState: FrontendState;
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
        maxCard: null,
        missionCards: null
    };

    constructor () {
        super({
            key: 'Game'
        });
    }

    init(data: InitData) {
        this.socket = data.socket;
        this.gameParams = data.gameParams;
    }

    preload () {
        this.preloader = new Preloader(this);
        this.load.baseURL = 'http://localhost:3000/cardimages/';
        [ 0, 1 ].concat(this.gameParams.preloadCardIds).forEach(id => this.load.image(`card_${id}`, `${id}.png`));
        [ 
            'equipment', 'hull', 'infrastructure', 'tactic', 'equipment_hull_infrastructure',
            'armour_1', 'armour_2', 'armour_3', 'shield_1', 'shield_2', 'point_defense_1', 'point_defense_2',
            'retract_card'
        ].forEach(name => this.load.image(`icon_${name}`, `icons/${name}.png`));
    }
    
    create () {
        this.socket.on(MsgTypeOutbound.State, (state: FrontendState) => {
            this.updateState(state);
        });
        this.socket.emit(MsgTypeInbound.Ready, TurnPhase.Init);
        this.obj.actionPool = new ActionPool(this);
        this.obj.button = new Button(this);
        this.obj.deck = new DeckCard(this);
        this.obj.discardPile = new DiscardPile(this, [])
        this.obj.prompt = new Prompt(this);
        this.obj.maxCard = new MaxCard(this);
        this.obj.missionCards = new MissionCards();
    }

    update() {}

    updateState(state: FrontendState) {
        this.oldState = this.state;
        this.state = state;
        //console.log(JSON.stringify(state.cardStacks)); ////
        this.preloader.destroy();
        this.recreateCards();
        this.createEventAnimations();
        this.resetSelections();
    }

    recreateCards() {
        const self = this;
        
        this.hand.forEach(h => {
            const newData = this.state.hand.find(hcd => hcd.uuid == h.uuid);
            if (newData) h.update(self, newData);
            else h.destroy(); // ISSUE #19: Actual logic on playing hand card event
        });
        this.state.hand
            .filter(c => !self.hand.some(h => h.uuid == c.uuid))
            .map(c => new HandCard(self, c))
            .forEach(h => self.hand.push(h));
        //this.hand.forEach(c => c.destroy());
        //this.hand = this.state.hand.map(cardData => new HandCard(self, cardData));

        this.cardStacks.forEach(cs => cs.destroy());
        this.cardStacks = [];
        this.state.cardStacks.forEach(cs => self.cardStacks.push(new CardStack(self, cs)));
        this.obj.discardPile.destroy();
        this.obj.discardPile = new DiscardPile(this, this.state.discardPileIds);
    }

    createEventAnimations() { // Not used yet
        this.state.events.forEach(e => {
            if (e.playerEvent) {
                switch (e.type) {
                    case EventType.Draw:
                        const handCard = this.hand.find(c => c.uuid == e.newUUID);
                        if (handCard) {
                            // Draw tween
                        }
                        break;
                }
            } else {
                // Opponent events
            }
        });
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
            upsideCardsNum: 0,
            shipIds: []
        }
        this.updateView();
    }

    updateView() {
        this.obj.actionPool.update(this);
        this.obj.button.update(this);
        this.obj.deck.update(this);
        this.obj.discardPile.update(this);
        this.obj.missionCards.update(this);
        this.obj.prompt.update(this);
        this.updateHighlighting();
    }

    updateHighlighting() {
        this.obj.deck.highlightReset();
        this.obj.discardPile.highlightReset();
        this.hand.forEach(c => c.highlightReset());
        this.cardStacks.forEach(c => c.highlightReset());
        if (this.state.playerPendingAction) {
            if (this.plannedBattle.type == BattleType.Mission) {
                this.obj.deck.highlightSelected();
                this.obj.discardPile.highlightSelected();
            }
            this.hand.forEach(c => {
                if (this.plannedBattle.type != BattleType.None) c.highlightDisabled();
                else if (this.activeHandCard == c.uuid) c.highlightSelected();
                else if (this.state.turnPhase != TurnPhase.End) c.highlightPlayability();
            });
            this.cardStacks.forEach(cs => {
                if (this.activeHandCard) { // Choose target for hand card
                    const activeCard = this.hand.find(c => c.uuid == this.activeHandCard);
                    if (activeCard.data.validTargets.includes(cs.uuid)) cs.highlightSelectable();
                } else {
                    switch (this.state.turnPhase) {
                        case TurnPhase.Build:
                            if (this.plannedBattle.type != BattleType.None) { // Assign ships for battle
                                if (cs.isOpponentColony() && this.plannedBattle.type == BattleType.Raid
                                        || this.plannedBattle.shipIds.includes(cs.uuid)) {
                                    cs.highlightSelected();
                                } else if (cs.data.missionReady) {
                                    cs.highlightSelectable();
                                }
                            } else if (this.state.battle.type != BattleType.None && !this.state.playerIsActive) { // Assign ships to intervene
                                if (this.interveneShipIds.includes(cs.uuid)) {
                                    cs.highlightSelected();
                                } else if (cs.data.interventionReady) {
                                    cs.highlightSelectable();
                                }
                            }
                            break;
                        case TurnPhase.Combat:
                            const allShips = this.state.battle.playerShipIds.concat(this.state.battle.opponentShipIds);
                            if (!allShips.includes(cs.uuid)) {
                                cs.highlightDisabled();
                            }
                            if (this.activeCardStack == cs.uuid && this.activeCardStackIndex >= 0) {
                                cs.cards[this.activeCardStackIndex].highlightSelected();
                            } else if (this.state.battle.playerShipIds.includes(cs.uuid)) {
                                cs.cards.filter(c => c.data.battleReady).forEach(c => c.highlightSelectable());
                            }
                            if (this.activeCardStack && this.state.battle.opponentShipIds.includes(cs.uuid)) {
                                cs.highlightSelectable();
                            }
                            break;
                    }
                }
            });
        }
    }
}