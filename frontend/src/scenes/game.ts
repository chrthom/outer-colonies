import { Socket } from 'socket.io-client';
import Button from '../components/button';
import Prompt from '../components/prompt';
import { FrontendState } from '../../../backend/src/components/frontend_converters/frontend_state';
import { BattleType, MsgTypeInbound, MsgTypeOutbound, TurnPhase } from '../../../backend/src/components/config/enums';
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

class ActiveCards {
    hand?: string;
    stack?: string;
    stackIndex?: number;
}

export default class Game extends Phaser.Scene {
    socket: Socket;
    gameParams: FrontendGameParams;
    preloader: Preloader;
    state: FrontendState;
    activeCards: ActiveCards;

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
        //console.log(JSON.stringify(state.battle)); ////
        this.preloader.destroy();

        const attack = this.state.battle ? this.state.battle.recentAttack : null;
        if (attack) {
            this.cardStacks.find(cs => cs.uuid == attack.sourceUUID).animateAttack();
            this.cardStacks.find(cs => cs.uuid == attack.targetUUID).animateDamage(attack);
        }
        setTimeout(() => {
            const newHandCards = self.state.hand
                .filter(c => !self.hand.some(h => h.uuid == c.uuid));
            self.retractCardsExists = false; // If true, then the hand animations are delayed
            self.cardStacks.forEach(cs => {
                const newData = self.state.cardStacks.find(csd => csd.uuid == cs.uuid);
                if (newData) cs.update(newData); // Move card stacks
                else if (newHandCards.some(h => cs.data.cards.some(c => c.id == h.cardId))) { // Retract card stack (to deck first)
                    cs.discard(true);
                    self.retractCardsExists = true;
                } else cs.discard(); // Discard card stack
            });
            self.state.cardStacks
                .filter(cs => !self.cardStacks.some(csd => csd.uuid == cs.uuid))
                .map(cs => {
                    const originHandCard = self.hand.find(h => h.uuid == cs.uuid);
                    if (originHandCard) originHandCard.destroy();
                    return new CardStack(self, cs, originHandCard);
                })
                .forEach(cs => self.cardStacks.push(cs));
            self.cardStacks = self.cardStacks.filter(cs => self.state.cardStacks.find(csd => csd.uuid == cs.uuid));
            setTimeout(() => {
                self.hand.map(h => {
                    const newData = self.state.hand.find(hcd => hcd.uuid == h.uuid);
                    const isTacticCard = !self.state.cardStacks.flatMap(cs => cs.cards).map(c => c.id).includes(h.cardId);
                    if (newData) h.update(newData); // Move hand card to new position
                    else if (oldState.turnPhase == TurnPhase.Build && isTacticCard) h.showAndDiscardTacticCard(); // Play tactic card
                    else if (oldState.turnPhase == TurnPhase.Build) h.destroy(); // Attach card to another card stack
                    else h.discard(); // Discard hand card
                });
                newHandCards // Draw new hand cards
                    .map(c => new HandCard(self, c))
                    .forEach(h => self.hand.push(h));
                self.hand = self.hand.filter(h => self.state.hand.find(hcd => hcd.uuid == h.uuid));
                self.resetView();
            }, self.retractCardsExists ? animationConfig.duration.move : 0);
        }, attack ? animationConfig.duration.attack : 0);
    }

    resetView(battleType?: BattleType) {
        this.activeCards.hand = null;
        this.activeCards.stack = null;
        this.activeCards.stackIndex = null;
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
        this.obj.discardPile.update();
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
                else if (this.activeCards.hand == c.uuid) c.highlightSelected();
                else if (this.state.turnPhase != TurnPhase.End) c.highlightPlayability();
            });
            this.cardStacks.forEach(cs => {
                if (this.activeCards.hand) { // Choose target for hand card
                    const activeCard = this.hand.find(c => c.uuid == this.activeCards.hand);
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
                            if (this.activeCards.stack == cs.uuid && this.activeCards.stackIndex >= 0) {
                                cs.cards[this.activeCards.stackIndex].highlightSelected();
                            } else if (this.state.battle.playerShipIds.includes(cs.uuid)) {
                                cs.cards.filter(c => c.data.battleReady).forEach(c => c.highlightSelectable());
                            }
                            if (this.activeCards.stack && this.state.battle.opponentShipIds.includes(cs.uuid)) {
                                cs.highlightSelectable();
                            }
                            break;
                    }
                }
            });
        }
    }
}