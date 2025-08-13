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
import ZoomCard from '../components/card/zoom_card';
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
import { loadCardResources, loadPreloadableResources } from './resource-loader';
import OptionPicker from '../components/option_picker';

interface ActiveCards {
  hand?: string;
  stackUUID?: string;
  cardUUID?: string;
}

interface FixedUIElements {
  continueButton: ContinueButton;
  combatRangeIndicator: CombatRangeIndicator;
  exitButton: ExitButton;
  missionCards: MissionCards;
  optionPicker?: OptionPicker;
  zoomCard: ZoomCard;
}

interface InitData {
  gameParams: ClientGameParams;
  socket: Socket;
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
    loadPreloadableResources(environment.urls.api, this.load);
    loadCardResources(environment.urls.api, this.load, this.gameParams.preloadCardIds);
  }

  create() {
    this.socket.on(MsgTypeOutbound.State, (state: ClientState) => {
      this.updateState(state);
    });
    this.socket.on(MsgTypeOutbound.Countdown, (countdown: number, isPlayerActive: boolean) => {
      (isPlayerActive ? this.player : this.opponent).countdownIndicator.update(countdown);
      (isPlayerActive ? this.opponent : this.player).countdownIndicator.update();
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
      zoomCard: new ZoomCard(this),
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
        this.time.delayedCall(animationConfig.duration.move, () => {
          if (this.state == state) {
            this.player.discardPile.update(this.state.player.discardPileIds);
            this.opponent.discardPile.update(this.state.opponent.discardPileIds);
          }
        });
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
    this.obj.zoomCard.hide();
    this.updateHighlighting();
  }

  getPlayerUI(isPlayer: boolean): PlayerUIElements {
    return isPlayer ? this.player : this.opponent;
  }

  getPlayerState(isPlayer: boolean): ClientPlayer {
    return isPlayer ? this.state.player : this.state.opponent;
  }

  discardMaximizedTacticCard() {
    if (!this.state.intervention) {
      this.maximizedTacticCard?.discard();
      this.maximizedTacticCard = undefined;
    }
  }

  private resetSelection(battleType?: BattleType) {
    this.activeCards.hand = undefined;
    this.activeCards.stackUUID = undefined;
    this.activeCards.cardUUID = undefined;
    this.interceptShipIds = [];
    this.plannedBattle = ClientPlannedBattleHelper.empty;
    this.plannedBattle.type = battleType ?? this.plannedBattle.type;
  }

  private animateAttack(): boolean {
    const attack = this.state.battle?.recentAttack;
    if (attack) {
      const attacker = this.cardStacks.find(cs => cs.uuid == attack.sourceRootUUID);
      if (!attacker?.data.ownedByPlayer) {
        attacker?.animateAttack(attack.sourceSubUUID);
      }
      this.cardStacks.find(cs => cs.uuid == attack.targetUUID)?.animateDamage(attack);
    }
    return !!attack;
  }

  private highlightAttackIntervention() {
    const intervention = this.state.intervention?.attack;
    if (intervention) {
      this.cardStacks
        .find(cs => cs.uuid == intervention.sourceRootUUID)
        ?.cards.find(c => c.data.uuid == intervention.sourceSubUUID)
        ?.highlightSelected();
      this.cardStacks.find(cs => cs.uuid == intervention.targetUUID)?.highlightSelected();
    }
  }

  private updateCardStacks(newHandCards: ClientHandCard[]) {
    // Update or remove old cards
    this.cardStacks.forEach(cs => {
      const newData = this.state.cardStacks.find(csd => csd.uuid == cs.uuid);
      if (newData)
        cs.update(newData); // Move existing card stacks
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
    this.discardMaximizedTacticCard();
    this.forBothPlayers((state, ui) =>
      ui.hand.map(h => {
        const newData = state.hand.find(hcd => hcd.uuid == h.uuid);
        if (h.uuid == this.state.highlightCardUUID) h.maximizeTacticCard();
        else if (newData)
          h.update(newData); // Move existing hand card to new position
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
              if (this.activeCards.stackUUID == cs.uuid && this.activeCards.cardUUID != undefined) {
                cs.cards.find(c => c.data.uuid == this.activeCards.cardUUID)?.highlightSelected();
              } else if (this.state.battle?.playerShipIds.includes(cs.uuid)) {
                cs.cards.filter(c => c.data.battleReady).forEach(c => c.highlightSelectable());
              }
              if (this.activeCards.stackUUID && this.state.battle?.opponentShipIds.includes(cs.uuid)) {
                cs.highlightSelectable();
              } else if (cs.canPerformAllAttackOnBase) {
                cs.highlightSelected();
              }
              break;
          }
        }
      });
    }
  }
}
