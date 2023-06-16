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
import { layout } from '../config/layout';
import { animationConfig } from '../config/animation';

class InitData {
    socket: Socket;
    gameParams: FrontendGameParams;
}

class StaticObjects {
    actionPool?: ActionPool;
    button?: Button;
    deck?: DeckCard;
    discardPile?: DiscardPile;
    prompt?: Prompt;
    maxCard?: MaxCard;
    missionCards?: MissionCards;
}

export default class Game extends Phaser.Scene {
    socket: Socket;
    gameParams: FrontendGameParams;
    preloader: Preloader;
    state: FrontendState;
    activeHandCard: string;
    activeCardStack: string;
    activeCardStackIndex: number;
    plannedBattle: FrontendPlannedBattle;
    interveneShipIds: Array<string> = [];
    hand: Array<HandCard> = [];
    cardStacks: Array<CardStack> = [];
    obj: StaticObjects = new StaticObjects();
    retractCardsExists: boolean = false;

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
        this.load.image('card_mask', 'utils/card_mask.png');
        this.load.image('card_glow', 'utils/card_glow.png');
    }
    
    create () {
        this.socket.on(MsgTypeOutbound.State, (state: FrontendState) => {
            this.updateState(state);
        });
        this.socket.emit(MsgTypeInbound.Ready, TurnPhase.Init);
        this.obj.actionPool = new ActionPool(this);
        this.obj.button = new Button(this);
        this.obj.deck = new DeckCard(this);
        this.obj.discardPile = new DiscardPile(this)
        this.obj.prompt = new Prompt(this);
        this.obj.maxCard = new MaxCard(this);
        this.obj.missionCards = new MissionCards(this);
    }

    update() {}

    updateState(state: FrontendState) {
        const self = this;
        const oldState = this.state;
        this.state = state;
        //console.log(JSON.stringify(state)); ////
        this.preloader.destroy();
        const newHandCards = this.state.hand
            .filter(c => !self.hand.some(h => h.uuid == c.uuid));
        this.retractCardsExists = false; // If true, then the hand animations are delayed
        this.cardStacks.forEach(cs => {
            const newData = this.state.cardStacks.find(csd => csd.uuid == cs.uuid);
            if (newData) cs.update(newData); // Move card stacks
            else if (newHandCards.some(h => cs.data.cards.some(c => c.id == h.cardId))) { // Retract card stack (to deck first)
                cs.discard(true);
                this.retractCardsExists = true;
            } else cs.discard(); // Discard card stack
        });
        this.state.cardStacks
            .filter(cs => !self.cardStacks.some(csd => csd.uuid == cs.uuid))
            .map(cs => {
                const originHandCard = this.hand.find(h => h.uuid == cs.uuid);
                if (originHandCard) originHandCard.destroy();
                return new CardStack(self, cs, originHandCard);
            })
            .forEach(cs => self.cardStacks.push(cs));
        this.cardStacks = this.cardStacks.filter(cs => this.state.cardStacks.find(csd => csd.uuid == cs.uuid));
        setTimeout(function() {
            self.hand.map(h => {
                const newData = self.state.hand.find(hcd => hcd.uuid == h.uuid);
                if (newData) h.update(newData); // Move hand cards to new position
                else if (oldState.turnPhase == TurnPhase.Build) {
                    console.log(`Destroy ${h.data.cardId}`); /////
                    h.destroy();
                    // ISSUE #19: Playing tactic card event
                    // ISSUE #49: Attach card to card stack
                } else h.discard(); // Discard hand cards
            });
            newHandCards // Draw new hand cards
                .map(c => new HandCard(self, c))
                .forEach(h => self.hand.push(h));
            self.hand = self.hand.filter(h => self.state.hand.find(hcd => hcd.uuid == h.uuid));
            self.resetView();
        }, this.retractCardsExists ? animationConfig.duration.move : 0);
    }

    resetView(battleType?: BattleType) {
        this.activeHandCard = null;
        this.activeCardStack = null;
        this.activeCardStackIndex = null;
        this.interveneShipIds = [];
        this.plannedBattle = {
            type: battleType ? battleType : BattleType.None,
            downsideCardsNum: 0,
            upsideCardsNum: 0,
            shipIds: []
        }
        this.updateView();
    }

    updateView() {
        this.obj.actionPool.update();
        this.obj.button.update();
        this.obj.deck.update();
        //this.obj.discardPile.update(this.state.discardPileIds);
        this.obj.missionCards.update();
        this.obj.prompt.update();
        this.updateHighlighting();
    }

    private updateHighlighting() {
        this.obj.deck.highlightReset();
        this.obj.discardPile.highlightReset();
        this.hand.forEach(c => c.highlightReset());
        this.cardStacks.forEach(c => c.highlightReset());
        if (this.state.playerPendingAction) {
            if (this.plannedBattle.type == BattleType.Mission) {
                this.obj.deck.highlightSelected();
                if (this.obj.discardPile.cardIds.length > 0) this.obj.discardPile.highlightSelected();
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