import { Socket } from 'socket.io-client';
import ContinueButton from '../components/buttons/continue_button';
import {
  ClientHandCard,
  ClientState,
  emptyClientState
} from '../../../../server/src/shared/interfaces/client_state';
import {
  BattleType,
  MsgTypeInbound,
  MsgTypeOutbound,
  TurnPhase
} from '../../../../server/src/shared/config/enums';
import HandCard from '../components/card/hand_card';
import CardStack from '../components/card/card_stack';
import DeckCard from '../components/card/deck_card';
import MaxCard from '../components/card/max_card';
import ClientPlannedBattle, {
  ClientPlannedBattleHelper
} from '../../../../server/src/shared/interfaces/client_planned_battle';
import ClientGameParams from '../../../../server/src/shared/interfaces/client_game_params';
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
import CountdownIndicator from '../components/indicators/countdown_indicator';

interface ActiveCards {
  hand?: string;
  stack?: string;
  stackIndex?: number;
}

interface FixedUIElements {
  continueButton: ContinueButton;
  combatRangeIndicator: CombatRangeIndicator;
  exitButton: ExitButton;
  maxCard: MaxCard;
  missionCards: MissionCards;
}

interface InitData {
  socket: Socket;
  gameParams: ClientGameParams;
}

interface PlayerUIElements {
  actionPool: ActionPool;
  countdownIndicator: CountdownIndicator;
  deck: DeckCard;
  discardPile: DiscardPile;
  hand: Array<HandCard>;
}

export default class Game extends Phaser.Scene {
  socket!: Socket;
  gameParams!: ClientGameParams;
  preloader!: Preloader;

  state: ClientState = emptyClientState;
  activeCards: ActiveCards = {};
  plannedBattle: ClientPlannedBattle = ClientPlannedBattleHelper.empty;
  interceptShipIds: Array<string> = [];
  retractCardsExist = false;

  hand: Array<HandCard> = [];
  cardStacks: Array<CardStack> = [];
  maximizedTacticCard?: CardImage;
  background!: Background;
  obj!: FixedUIElements;
  player!: PlayerUIElements;
  //opponent: PlayerUIElements; // TODO: Implement for opponent too

  constructor() {
    super({
      key: 'Game'
    });
  }

  init(data: InitData) {
    this.socket = data.socket;
    this.gameParams = data.gameParams;
    this.background = new Background(this);
  }

  preload() {
    this.preloader = new Preloader(this);
    this.load.baseURL = `${environment.urls.api}/assets/`;
    backgroundConfig.orbs
      .map(o => o.name)
      .forEach(name => this.load.image(`background_orb_${name}`, `background/orb_${name}.png`));
    backgroundConfig.rings.forEach(name =>
      this.load.image(`background_ring_${name}`, `background/ring_${name}.png`)
    );
    this.load.image('background_sun', 'background/sun.png');
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
    [0, 1]
      .concat(this.gameParams?.preloadCardIds ?? [])
      .forEach(id => this.load.image(`card_${id}`, `cards/${id}.png`));
    [
      'equipment',
      'hull',
      'infrastructure',
      'tactic',
      'intelligence',
      'military',
      'science',
      'trade',
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
    ['mask', 'mask_small', 'glow', 'glow_small'].forEach(name =>
      this.load.image(`card_${name}`, `utils/card_${name}.png`)
    );
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
  }

  create() {
    this.socket.on(MsgTypeOutbound.State, (state: ClientState) => {
      this.updateState(state);
    });
    this.socket.on(MsgTypeOutbound.Countdown, (countdown: number[]) => {
      this.player?.countdownIndicator.update(countdown[0], countdown[1]);
    });
    this.background.initInterface();
    this.player = {
      actionPool: new ActionPool(this),
      countdownIndicator: new CountdownIndicator(this),
      deck: new DeckCard(this),
      discardPile: new DiscardPile(this),
      hand: []
    };
    this.obj = {
      combatRangeIndicator: new CombatRangeIndicator(this),
      continueButton: new ContinueButton(this),
      exitButton: new ExitButton(this),
      maxCard: new MaxCard(this),
      missionCards: new MissionCards(this)
    };
    this.socket.emit(MsgTypeInbound.Ready, TurnPhase.Init);
  }

  updateState(state: ClientState) {
    const oldState = this.state ?? state;
    this.state = state;
    //console.log(JSON.stringify(state)); ////
    this.preloader.destroy();
    this.resetSelection();
    this.time.delayedCall(this.animateAttack() ? animationConfig.duration.attack : 0, () => {
      const newHandCards = this.state.hand.filter(c => !this.hand.some(h => h.uuid == c.uuid), this);
      this.retractCardsExist = false; // If true, then the hand animations are delayed
      this.updateCardStacks(newHandCards);
      this.time.delayedCall(this.retractCardsExist ? animationConfig.duration.move : 0, () => {
        this.updateHandCards(newHandCards, oldState);
        this.animateOpponentTacticCard(oldState);
        this.updateView();
        this.highlightAttackIntervention();
        this.time.delayedCall(animationConfig.duration.waitBeforeDiscard, () =>
          this.discardMaximizedTacticCard()
        );
      });
    });
  }

  resetView(battleType?: BattleType) {
    this.resetSelection(battleType);
    this.updateView();
  }

  updateView() {
    this.background.update();
    [this.player].forEach(ui => {
      ui.actionPool.update();
      ui.deck.update();
      ui.discardPile.update();
    });
    this.obj.continueButton.update();
    this.obj.combatRangeIndicator.update();
    this.obj.exitButton.update();
    this.obj.missionCards.update();
    this.obj.maxCard.hide();
    this.updateHighlighting();
  }

  private resetSelection(battleType?: BattleType) {
    this.activeCards.hand = undefined;
    this.activeCards.stack = undefined;
    this.activeCards.stackIndex = undefined;
    this.interceptShipIds = [];
    this.plannedBattle = ClientPlannedBattleHelper.empty;
    this.plannedBattle.type = battleType ?? this.plannedBattle.type;
  }

  private animateAttack(): boolean {
    const attack = this.state.battle?.recentAttack;
    if (attack) {
      const attacker = this.cardStacks.find(cs => cs.uuid == attack.sourceUUID);
      if (!attacker?.data.ownedByPlayer) {
        attacker?.animateAttack(attack.sourceIndex);
      }
      this.cardStacks.find(cs => cs.uuid == attack.targetUUID)?.animateDamage(attack);
    }
    return !!attack;
  }

  private highlightAttackIntervention() {
    const intervention = this.state.intervention?.attack;
    if (intervention) {
      this.cardStacks
        .find(cs => cs.uuid == intervention.sourceUUID)
        ?.cards[intervention.sourceIndex].highlightSelected();
      this.cardStacks.find(cs => cs.uuid == intervention.targetUUID)?.highlightSelected();
    }
  }

  private updateCardStacks(newHandCards: ClientHandCard[]) {
    this.cardStacks.forEach(cs => {
      const newData = this.state.cardStacks.find(csd => csd.uuid == cs.uuid);
      if (newData) cs.update(newData); // Move existing card stacks
      else if (newHandCards.some(h => cs.data.cards.some(c => c.id == h.cardId))) {
        // Retract card stack (to deck first)
        cs.discard(true);
        this.retractCardsExist = true;
      } else cs.discard(); // Discard card stack
    }, this);
    // Create new card stacks
    this.state.cardStacks
      .filter(cs => !this.cardStacks.some(csd => csd.uuid == cs.uuid), this)
      .map(cs => {
        let origin: CardImage | undefined;
        if (this.maximizedTacticCard?.cardId == cs.cards[0].id) {
          origin = this.maximizedTacticCard; // Origin is maximized tactic card
          this.maximizedTacticCard = undefined;
        } else {
          origin = this.hand.find(h => h.uuid == cs.uuid); // Origin is a hand card
        }
        origin?.destroy();
        return new CardStack(this, cs, origin);
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
      if (h.uuid == this.state.highlightCardUUID) h.maximizeTacticCard(); //
      else if (newData) h.update(newData); // Move existing hand card to new position
      else if (oldState.turnPhase != TurnPhase.Build) h.discard();
      else h.destroy(); // Card was attached to a card stack in updateCardStacks()
    }, this);
    newHandCards // Draw new hand cards
      .map(c => new HandCard(this, c), this)
      .forEach(h => this.hand.push(h), this);
    this.hand = this.hand.filter(h => this.state.hand.find(hcd => hcd.uuid == h.uuid), this);
  }

  private animateOpponentTacticCard(oldState: ClientState) {
    const cardId = oldState.opponent.hand.find(hcd => hcd.uuid == this.state.highlightCardUUID)?.cardId;
    if (cardId) {
      new CardImage( // TODO: Animate from opponent hand
        this,
        layoutConfig.game.cards.placement.opponent.deck.x,
        layoutConfig.game.cards.placement.opponent.deck.y,
        cardId,
        {
          isOpponentCard: true
        }
      ).maximizeTacticCard();
    }
  }

  private discardMaximizedTacticCard() {
    if (!this.state.intervention) this.maximizedTacticCard?.discard();
  }

  private updateHighlighting() {
    this.player.deck.highlightReset();
    this.player.discardPile.highlightReset();
    this.hand.forEach(c => c.highlightReset());
    this.cardStacks.forEach(c => c.highlightReset());
    if (this.state.playerPendingAction) {
      if (this.plannedBattle.type == BattleType.Mission) {
        this.player.deck.highlightSelected();
        if (this.player.discardPile.cardIds.length > 0) {
          this.player.discardPile.highlightSelected();
        }
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
          const allShips = this.state.battle?.playerShipIds.concat(this.state.battle.opponentShipIds);
          switch (this.state.turnPhase) {
            case TurnPhase.Build:
              if (this.plannedBattle.type != BattleType.None) {
                // Assign ships for battle
                if (
                  (cs.isOpponentColony && this.plannedBattle.type == BattleType.Raid) ||
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
