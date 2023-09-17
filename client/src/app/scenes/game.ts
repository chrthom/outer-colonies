import { Socket } from 'socket.io-client';
import ContinueButton from '../components/buttons/continue_button';
import {
  ClientHandCard,
  ClientState
} from '../../../../server/src/components/shared_interfaces/client_state';
import {
  BattleType,
  MsgTypeInbound,
  MsgTypeOutbound,
  TurnPhase
} from '../../../../server/src/components/config/enums';
import HandCard from '../components/card/hand_card';
import CardStack from '../components/card/card_stack';
import DeckCard from '../components/card/deck_card';
import MaxCard from '../components/card/max_card';
import { ClientPlannedBattle } from '../../../../server/src/components/shared_interfaces/client_planned_battle';
import { ClientGameParams } from '../../../../server/src/components/shared_interfaces/client_game_params';
import DiscardPile from '../components/card/discard_pile';
import ActionPool from '../components/action_pool';
import MissionCards from '../components/card/mission_cards';
import Preloader from '../components/preloader';
import { animationConfig } from '../config/animation';
import Background from '../components/background';
import CombatRangeIndicator from '../components/indicators/combat_range_indicator';
import CardImage from '../components/card/card_image';
import { layoutConfig } from '../config/layout';
import ExitButton from '../components/buttons/exit_button';
import { environment } from '../../environments/environment';
import { backgroundConfig } from '../config/background';

interface InitData {
  socket: Socket;
  gameParams: ClientGameParams;
}

class StaticObjects {
  actionPool?: ActionPool;
  background?: Background;
  continueButton?: ContinueButton;
  combatRangeIndicator?: CombatRangeIndicator;
  deck?: DeckCard;
  discardPile?: DiscardPile;
  exitButton?: ExitButton;
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
  gameParams: ClientGameParams;
  preloader: Preloader;
  state: ClientState;
  activeCards: ActiveCards = new ActiveCards();
  plannedBattle: ClientPlannedBattle;
  interceptShipIds: Array<string> = [];
  hand: Array<HandCard> = [];
  cardStacks: Array<CardStack> = [];
  obj: StaticObjects = new StaticObjects();
  retractCardsExist: boolean = false;

  constructor() {
    super({
      key: 'Game'
    });
  }

  init(data: InitData) {
    this.socket = data.socket;
    this.gameParams = data.gameParams;
    this.obj.background = new Background(this);
  }

  preload() {
    this.preloader = new Preloader(this);
    this.load.baseURL = `${environment.urls.api}/assets/`;
    [0, 1]
      .concat(this.gameParams.preloadCardIds)
      .forEach(id => this.load.image(`card_${id}`, `cards/${id}.png`));
    [
      'equipment',
      'hull',
      'infrastructure',
      'tactic',
      'economy',
      'intelligence',
      'military',
      'science',
      'equipment_hull_infrastructure',
      'equipment_hull_infrastructure_tactic',
      'armour_1',
      'armour_2',
      'armour_3',
      'shield_1',
      'shield_2',
      'point_defense_1',
      'point_defense_2',
      'retract_card',
      'exit'
    ].forEach(name => this.load.image(`icon_${name}`, `icons/${name}.png`));
    this.load.image('card_mask', 'utils/card_mask.png');
    this.load.image('card_glow', 'utils/card_glow.png');
    ['red', 'yellow', 'blue', 'white'].forEach(color =>
      this.load.image(`flare_${color}`, `utils/flare_${color}.png`)
    );
    this.load.image('zone_corner_player', 'utils/zone_corner_blue.png');
    this.load.image('zone_corner_opponent', 'utils/zone_corner_red.png');
    [1, 2, 3, 4].forEach(r => this.load.image(`range_${r}`, `utils/range${r}.png`));
    [
      'active_build',
      'active_combat',
      'active_select',
      'active_wait',
      'won',
      'inactive_combat',
      'inactive_select',
      'inactive_wait',
      'lost'
    ].forEach(name => this.load.image(`button_${name}`, `utils/button_${name}.png`));
    this.load.image('prompt_box', 'utils/prompt_box.png');
    backgroundConfig.orbs
      .map(o => o.name)
      .forEach(name => this.load.image(`background_orb_${name}`, `background/orb_${name}.png`));
    backgroundConfig.rings.forEach(name =>
      this.load.image(`background_ring_${name}`, `background/ring_${name}.png`)
    );
    this.load.image(`background_sun`, `background/sun.png`);
    [
      'asteroid1',
      'corvette1',
      'corvette2',
      'corvette3',
      'freighter1',
      'freighter2',
      'freighter3',
      'station1',
      'torpedos1'
    ].forEach(name => this.load.image(`background_vessel_${name}`, `background/vessel_${name}.png`));
  }

  create() {
    this.socket.on(MsgTypeOutbound.State, (state: ClientState) => {
      this.updateState(state);
    });
    this.socket.emit(MsgTypeInbound.Ready, TurnPhase.Init);
    this.obj.background?.initInterface();
    this.obj.actionPool = new ActionPool(this);
    this.obj.combatRangeIndicator = new CombatRangeIndicator(this);
    this.obj.continueButton = new ContinueButton(this);
    this.obj.deck = new DeckCard(this);
    this.obj.discardPile = new DiscardPile(this);
    this.obj.exitButton = new ExitButton(this);
    this.obj.maxCard = new MaxCard(this);
    this.obj.missionCards = new MissionCards(this);
  }

  override update() {}

  updateState(state: ClientState) {
    const oldState = this.state ? this.state : state;
    this.state = state;
    //console.log(JSON.stringify(state)); ////
    this.preloader.destroy();
    const attackPerformed = this.animateAttack();
    this.time.delayedCall(attackPerformed ? animationConfig.duration.attack : 0, () => {
      const newHandCards = this.state.hand.filter(c => !this.hand.some(h => h.uuid == c.uuid), this);
      this.retractCardsExist = false; // If true, then the hand animations are delayed
      this.updateCardStacks(newHandCards);
      this.time.delayedCall(this.retractCardsExist ? animationConfig.duration.move : 0, () => {
        this.updateHandCards(newHandCards, oldState);
        this.showOpponentTacticCardAction(oldState);
        this.resetView();
      });
    });
  }

  resetView(battleType?: BattleType) {
    this.activeCards.hand = undefined;
    this.activeCards.stack = undefined;
    this.activeCards.stackIndex = undefined;
    this.interceptShipIds = [];
    this.plannedBattle = {
      type: battleType ? battleType : BattleType.None,
      downsideCardsNum: 0,
      upsideCardsNum: 0,
      shipIds: []
    };
    this.updateView();
  }

  updateView() {
    this.obj.actionPool?.update();
    this.obj.background?.update();
    this.obj.continueButton?.update();
    this.obj.combatRangeIndicator?.update();
    this.obj.deck?.update();
    this.obj.discardPile?.update();
    this.obj.exitButton?.update();
    this.obj.missionCards?.update();
    this.obj.maxCard?.hide();
    this.updateHighlighting();
  }

  private animateAttack(): boolean {
    const attack = this.state.battle ? this.state.battle.recentAttack : null;
    if (attack) {
      const attacker = this.cardStacks.find(cs => cs.uuid == attack.sourceUUID);
      if (!attacker?.data.ownedByPlayer) {
        attacker?.animateAttack(attack.sourceIndex);
      }
      this.cardStacks.find(cs => cs.uuid == attack.targetUUID)?.animateDamage(attack);
      return true;
    } else {
      return false;
    }
  }

  private updateCardStacks(newHandCards: ClientHandCard[]) {
    this.cardStacks.forEach(cs => {
      const newData = this.state.cardStacks.find(csd => csd.uuid == cs.uuid);
      if (newData) cs.update(newData); // Move card stacks
      else if (newHandCards.some(h => cs.data.cards.some(c => c.id == h.cardId))) {
        // Retract card stack (to deck first)
        cs.discard(true);
        this.retractCardsExist = true;
      } else cs.discard(); // Discard card stack
    }, this);
    this.state.cardStacks
      .filter(cs => !this.cardStacks.some(csd => csd.uuid == cs.uuid), this)
      .map(cs => {
        const originHandCard = this.hand.find(h => h.uuid == cs.uuid);
        if (originHandCard) originHandCard.destroy();
        return new CardStack(this, cs, true, originHandCard);
      }, this)
      .forEach(cs => this.cardStacks.push(cs), this);
    this.cardStacks = this.cardStacks.filter(
      cs => this.state.cardStacks.find(csd => csd.uuid == cs.uuid),
      this
    );
  }

  private updateHandCards(newHandCards: ClientHandCard[], oldState: ClientState) {
    this.hand.map(h => {
      const newData = this.state.hand.find(hcd => hcd.uuid == h.uuid);
      const isTacticCard = !this.state.cardStacks
        .flatMap(cs => cs.cards)
        .map(c => c.id)
        .includes(h.cardId);
      if (newData) h.update(newData); // Move hand card to new position
      else if (oldState.turnPhase == TurnPhase.Build && isTacticCard)
        h.showAndDiscardTacticCard(true); // Play tactic card
      else if (oldState.turnPhase == TurnPhase.Build) h.destroy(); // Attach card to another card stack
      else h.discard(true); // Discard hand card
    }, this);
    newHandCards // Draw new hand cards
      .map(c => new HandCard(this, c), this)
      .forEach(h => this.hand.push(h), this);
    this.hand = this.hand.filter(h => this.state.hand.find(hcd => hcd.uuid == h.uuid), this);
  }

  private showOpponentTacticCardAction(oldState: ClientState) {
    const opponent = this.state.opponent;
    const oldOpponent = oldState.opponent;
    if (
      opponent.handCardSize + opponent.deckSize < oldOpponent.handCardSize + oldOpponent.deckSize &&
      opponent.discardPileIds.length > oldOpponent.discardPileIds.length &&
      this.state.turnPhase == TurnPhase.Build &&
      oldState.turnPhase == TurnPhase.Build
    ) {
      // Opponent playing tactic card
      const cardId =
        opponent.discardPileIds.length > 0
          ? opponent.discardPileIds[opponent.discardPileIds.length - 1]
          : null;
      if (
        cardId &&
        !this.state.cardStacks
          .flatMap(cs => cs.cards)
          .map(c => c.id)
          .includes(cardId)
      ) {
        new CardImage(
          this,
          layoutConfig.discardPile.x,
          layoutConfig.discardPile.yOpponent,
          cardId,
          true
        ).showAndDiscardTacticCard(false);
      }
    }
  }

  private updateHighlighting() {
    this.obj.deck?.highlightReset();
    this.obj.discardPile?.highlightReset();
    this.hand.forEach(c => c.highlightReset());
    this.cardStacks.forEach(c => c.highlightReset());
    if (this.state.playerPendingAction) {
      if (this.plannedBattle.type == BattleType.Mission) {
        this.obj.deck?.highlightSelected();
        if (this.obj.discardPile && this.obj.discardPile.cardIds.length > 0)
          this.obj.discardPile.highlightSelected();
      }
      this.hand.forEach(c => {
        if (this.plannedBattle.type != BattleType.None) c.highlightDisabled();
        else if (this.activeCards.hand == c.uuid) c.highlightSelected();
        else if (this.state.turnPhase != TurnPhase.End) c.highlightPlayability();
        else c.highlightSelectable();
      });
      this.cardStacks.forEach(cs => {
        if (this.activeCards.hand) {
          // Choose target for hand card
          const activeCard = this.hand.find(c => c.uuid == this.activeCards.hand);
          if (activeCard && activeCard.data.validTargets.includes(cs.uuid)) cs.highlightSelectable();
        } else {
          switch (this.state.turnPhase) {
            case TurnPhase.Build:
              if (this.plannedBattle.type != BattleType.None) {
                // Assign ships for battle
                if (
                  (cs.isOpponentColony() && this.plannedBattle.type == BattleType.Raid) ||
                  this.plannedBattle.shipIds.includes(cs.uuid)
                ) {
                  cs.highlightSelected();
                } else if (cs.data.missionReady) {
                  cs.highlightSelectable();
                }
              } else if (this.state.battle?.type != BattleType.None && !this.state.playerIsActive) {
                // Assign ships to intercept
                if (this.interceptShipIds.includes(cs.uuid)) {
                  cs.highlightSelected();
                } else if (cs.data.interceptionReady) {
                  cs.highlightSelectable();
                }
              }
              break;
            case TurnPhase.Combat:
              const allShips = this.state.battle?.playerShipIds.concat(this.state.battle.opponentShipIds);
              if (!allShips?.includes(cs.uuid)) {
                cs.highlightDisabled();
              }
              if (
                this.activeCards.stack == cs.uuid &&
                this.activeCards.stackIndex != undefined &&
                this.activeCards.stackIndex >= 0
              ) {
                cs.cards[this.activeCards.stackIndex].highlightSelected();
              } else if (this.state.battle?.playerShipIds.includes(cs.uuid)) {
                cs.cards.filter(c => c.data.battleReady).forEach(c => c.highlightSelectable());
              }
              if (this.activeCards.stack && this.state.battle?.opponentShipIds.includes(cs.uuid)) {
                cs.highlightSelectable();
              }
              break;
          }
        }
      });
    }
  }
}
