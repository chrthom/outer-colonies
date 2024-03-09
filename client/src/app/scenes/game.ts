import { Socket } from 'socket.io-client';
import ContinueButton from '../components/buttons/continue_button';
import {
  ClientHandCard,
  ClientPlayer,
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
import ExitButton from '../components/buttons/exit_button';
import { environment } from '../../environments/environment';
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

  cardStacks: Array<CardStack> = [];
  maximizedTacticCard?: CardImage;
  background!: Background;
  obj!: FixedUIElements;
  player!: PlayerUIElements;
  opponent!: PlayerUIElements;

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
    this.load.image('zone_corner', 'utils/zone_corner.png');
    [0, 1]
      .concat(this.gameParams.preloadCardIds)
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
      this.player?.countdownIndicator.update(countdown[0]);
      this.opponent?.countdownIndicator.update(countdown[1]);
    });
    this.background.initInterface();
    this.opponent = {
      actionPool: new ActionPool(this, false),
      countdownIndicator: new CountdownIndicator(this, false),
      deck: new DeckCard(this, false),
      discardPile: new DiscardPile(this, false),
      hand: []
    };
    this.player = {
      actionPool: new ActionPool(this, true),
      countdownIndicator: new CountdownIndicator(this, true),
      deck: new DeckCard(this, true),
      discardPile: new DiscardPile(this, true),
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
    const previousTurnPhase = this.state?.turnPhase ?? TurnPhase.Init;
    this.state = state;
    //console.log(JSON.stringify(state)); ////
    this.preloader.destroy();
    this.resetSelection();
    this.time.delayedCall(this.animateAttack() ? animationConfig.duration.attack : 0, () => {
      const newHandCards = this.newHandCards;
      this.retractCardsExist = false; // If true, then the hand animations are delayed
      this.updateCardStacks(newHandCards);
      this.time.delayedCall(this.retractCardsExist ? animationConfig.duration.move : 0, () => {
        this.updateHandCards(newHandCards, previousTurnPhase);
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
    [this.player, this.opponent].forEach(ui => {
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

  getPlayerUI(isPlayer: boolean): PlayerUIElements {
    return isPlayer ? this.player : this.opponent;
  }

  getPlayerState(isPlayer: boolean): ClientPlayer {
    return isPlayer ? this.state.player : this.state.opponent;
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
          origin = this.getPlayerUI(cs.ownedByPlayer).hand.find(h => h.uuid == cs.uuid); // Origin is a hand card
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

  private updateHandCards(newHandCards: ClientHandCard[], previousTurnPhase: TurnPhase) {
    this.forBothPlayers((state, ui) =>
      ui.hand.map(h => {
        const newData = state.hand.find(hcd => hcd.uuid == h.uuid);
        if (h.uuid == this.state.highlightCardUUID) h.maximizeTacticCard();
        else if (newData) h.update(newData); // Move existing hand card to new position
        else if (previousTurnPhase != TurnPhase.Build) h.discard();
        else h.destroy(); // Card was attached to a card stack in updateCardStacks()
      }, this)
    );
    newHandCards // Draw new hand cards
      .map(c => new HandCard(this, c), this)
      .forEach(h => this.getPlayerUI(h.ownedByPlayer).hand.push(h), this);
    this.forBothPlayers(
      (state, ui) => (ui.hand = ui.hand.filter(h => state.hand.find(chc => chc.uuid == h.uuid)))
    );
  }

  private get newHandCards(): ClientHandCard[] {
    return this.forBothPlayers((state, ui) =>
      state.hand.filter(c => !ui.hand.some(h => h.uuid == c.uuid))
    ).flat();
  }

  private forBothPlayers<T>(f: (state: ClientPlayer, ui: PlayerUIElements) => T): T[] {
    return [true, false].map(isPlayer => f(this.getPlayerState(isPlayer), this.getPlayerUI(isPlayer)), this);
  }

  private discardMaximizedTacticCard() {
    if (!this.state.intervention) {
      this.maximizedTacticCard?.discard();
      this.maximizedTacticCard = undefined;
    }
  }

  private updateHighlighting() {
    [this.player, this.opponent].forEach(uiElements => {
      uiElements.deck.highlightReset();
      uiElements.discardPile.highlightReset();
      uiElements.hand.forEach(c => c.highlightReset());
    });
    this.cardStacks.forEach(c => c.highlightReset());
    if (this.state.playerPendingAction) {
      if (this.plannedBattle.type == BattleType.Mission) {
        this.player.deck.highlightSelected();
        if (this.player.discardPile.cardIds.length > 0) {
          this.player.discardPile.highlightSelected();
        }
      }
      this.player.hand.forEach(c => {
        if (this.plannedBattle.type != BattleType.None) c.highlightDisabled();
        else if (this.activeCards.hand == c.uuid) c.highlightSelected();
        else if (this.state.turnPhase != TurnPhase.End) c.highlightPlayability();
        else c.highlightSelectable();
      });
      this.cardStacks.forEach(cs => {
        if (this.activeCards.hand) {
          // Choose target for hand card
          const activeCard = this.player.hand.find(c => c.uuid == this.activeCards.hand);
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
