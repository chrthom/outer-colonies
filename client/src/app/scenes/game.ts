import { Socket } from 'socket.io-client';
import ContinueButton from '../components/buttons/continue_button';
import RaidButton from '../components/buttons/raid_button';
import MissionButton from '../components/buttons/mission_button';
import {
  ClientEvent,
  ClientGameResult,
  ClientHandCard,
  ClientPlayer,
  ClientState,
  emptyClientState
} from '@shared/interfaces/client_state';
import { BattleType, EventType, MsgTypeInbound, MsgTypeOutbound, TurnPhase } from '@shared/config/enums';
import GameOverIndicator from '../components/indicators/game_over_indicator';
import HandCard from '../components/card/hand_card';
import CardStack from '../components/card/card_stack';
import DeckCard from '../components/card/deck_card';
import ZoomCard from '../components/card/zoom_card';
import ClientPlannedBattle, { ClientPlannedBattleHelper } from '@shared/interfaces/client_planned_battle';
import ClientGameParams from '@shared/interfaces/client_game_params';
import DiscardPile from '../components/card/discard_pile';
import ActionPool from '../components/action_pool';
import Preloader from '../components/preloader';
import { animationConfig } from '../config/animation';
import { designConfig } from '../config/design';
import Background from '../components/background';
import CombatRangeIndicator from '../components/indicators/combat_range_indicator';
import CardImage from '../components/card/card_image';
import ExitButton from '../components/buttons/exit_button';
import { environment } from '../../environments/environment';
import CountdownIndicator from '../components/indicators/countdown_indicator';
import { layoutConfig } from '../config/layout';
import { rules } from '@shared/config/rules';
import { loadCardResources, loadPreloadableResources } from './resource-loader';
import OptionPicker from '../components/option_picker';
import SocketService from '../socket_service';
import StateUpdateSequencer from '../utils/state_update_sequencer';

interface ActiveCards {
  hand?: string;
  stackUUID?: string;
  cardUUID?: string;
}

interface FixedUIElements {
  continueButton: ContinueButton;
  combatRangeIndicator: CombatRangeIndicator;
  exitButton: ExitButton;
  optionPicker?: OptionPicker;
  zoomCard: ZoomCard;
  raidButton: RaidButton;
  missionButton: MissionButton;
}

interface InitData {
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
  isAttackAnimating = false;

  private stateUpdateSequencer = new StateUpdateSequencer((delayMs, callback) =>
    this.time.delayedCall(delayMs, callback)
  );
  private pendingCardMovementEvents = new Map<string, ClientEvent>();

  cardStacks: Array<CardStack> = [];
  maximizedTacticCard?: CardImage;
  private gameOverIndicator?: GameOverIndicator;
  connectionLost = false;
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
    this.socket = SocketService.getSocket();
    this.gameParams = data.gameParams;
    // A socket.io reconnect cannot rejoin the match; rejoining happens via a fresh page load
    this.socket.io.reconnection(false);
    // Phaser reuses the scene instance for the next match, so reset the
    // reference to allow a fresh game over overlay in the new game.
    this.gameOverIndicator = undefined;
    this.connectionLost = false;
    this.pendingCardMovementEvents.clear();
    this.background = new Background(this);
  }

  preload() {
    this.preloader = new Preloader(this);
    loadPreloadableResources(environment.urls.api, this.load);
    loadCardResources(environment.urls.api, this.load, this.gameParams.preloadCardIds);
  }

  create() {
    this.registerSocketListeners();
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
      raidButton: new RaidButton(this),
      missionButton: new MissionButton(this)
    };
    this.socket.emit(MsgTypeInbound.Ready, TurnPhase.Init);
  }

  /**
   * Registers the socket listeners of the game scene.
   *
   * All listeners are bound to the scene lifecycle and removed again on scene
   * shutdown, so that no listeners of a finished match leak into the next
   * matchmaking session.
   */
  private registerSocketListeners(): void {
    this.socket.on(MsgTypeOutbound.State, (state: ClientState) => {
      this.updateState(state);
    });
    this.socket.on(MsgTypeOutbound.Countdown, (countdown: number, isPlayerActive: boolean) => {
      (isPlayerActive ? this.player : this.opponent).countdownIndicator.update(countdown);
      (isPlayerActive ? this.opponent : this.player).countdownIndicator.update();
    });
    this.socket.on('disconnect', () => {
      this.showConnectionLostMessage();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.socket.off(MsgTypeOutbound.State);
      this.socket.off(MsgTypeOutbound.Countdown);
      this.socket.off('disconnect');
    });
  }

  /**
   * Shows the game over overlay for the given result exactly once per game.
   * Any later call (e.g. from additional states or user interactions after the game result)
   * is ignored, so exactly one overlay exists regardless of how many updates arrive.
   */
  showGameOverIndicator(gameResult: ClientGameResult) {
    if (!this.gameOverIndicator) {
      this.gameOverIndicator = new GameOverIndicator(this, gameResult);
    }
  }

  /**
   * Shows a reload hint on a mid-game disconnect: the match stays alive for the
   * reconnection grace window, so the player can rejoin by reloading the page.
   */
  showConnectionLostMessage() {
    if (this.connectionLost || this.state.gameResult) return;
    this.connectionLost = true;
    this.add
      .text(
        layoutConfig.scene.width / 2,
        layoutConfig.scene.height / 2,
        `Verbindung verloren.\nBitte Seite neu laden, um das Spiel fortzusetzen.\nDas Spiel endet ${rules.reconnectGracePeriod} Sekunden nach dem Verbindungsabbruch.`
      )
      .setFontSize(layoutConfig.fontSize.normal)
      .setFontFamily(designConfig.fontFamily.text)
      .setColor(designConfig.color.warn)
      .setAlign('center')
      .setOrigin(0.5)
      .setDepth(layoutConfig.depth.gameOver);
    if (this.obj) this.obj.exitButton.update();
    // No further state arrives while disconnected, so destroy a pending option
    // picker that would otherwise linger over the connection lost message.
    this.obj?.optionPicker?.destroy();
  }

  /**
   * Applies a new game state to the UI via a cancel-and-replace sequencer:
   * `this.state` is stored immediately as the single source of truth, while
   * the animation steps are enqueued. If a newer state arrives while an
   * older chain is still running, the queued steps of the older chain are
   * cancelled and the new chain reconciles directly to the newest state,
   * animating only the remaining delta.
   */
  updateState(state: ClientState) {
    for (const event of state.events) {
      if (event.oldUUID) this.pendingCardMovementEvents.set(event.oldUUID, event);
    }
    this.state = state;
    this.preloader.destroy();
    this.resetSelection();
    this.destroyStaleOptionPicker(state);
    const attackAnimating = this.animateAttack();
    let newHandCards: ClientHandCard[] = [];
    this.stateUpdateSequencer.run([
      {
        delay: () => (attackAnimating ? animationConfig.duration.attack : 0),
        action: () => {
          newHandCards = this.newHandCards;
          this.retractCardsExist = false; // If true, then the hand animations are delayed
          this.updateCardStacks();
        }
      },
      {
        delay: () => (this.retractCardsExist ? animationConfig.duration.move : 0),
        action: () => {
          this.updateHandCards(newHandCards);
          this.pendingCardMovementEvents.clear();
          this.updateView();
          this.highlightAttackIntervention();
        }
      },
      {
        delay: () => animationConfig.duration.move,
        action: () => {
          this.player.discardPile.update(this.state.player.discardPileIds);
          this.opponent.discardPile.update(this.state.opponent.discardPileIds);
        }
      }
    ]);
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
    this.obj.zoomCard.hide();
    this.obj.raidButton.updateVisibility();
    this.obj.missionButton.updateVisibility();
    this.updateHighlighting();
  }

  getPlayerUI(isPlayer: boolean): PlayerUIElements {
    return isPlayer ? this.player : this.opponent;
  }

  getPlayerState(isPlayer: boolean): ClientPlayer {
    return isPlayer ? this.state.player : this.state.opponent;
  }

  /**
   * Returns the card movement event (retract or discard) reported by the server for the card
   * with the given UUID, including events buffered from states whose animation chain was
   * superseded before reconciling the UI.
   * @param cardUUID UUID of the card (stack) to look up
   */
  getCardMovementEvent(cardUUID: string): ClientEvent | undefined {
    return this.pendingCardMovementEvents.get(cardUUID) ?? this.state.events.find(e => e.oldUUID == cardUUID);
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

  /**
   * Destroys a pending option picker if the incoming state invalidated its pending
   * action, e.g. because the countdown expired or the hand card is no longer playable.
   * @param state incoming client state
   */
  private destroyStaleOptionPicker(state: ClientState) {
    const optionPicker = this.obj?.optionPicker;
    if (optionPicker && !optionPicker.isValidFor(state)) optionPicker.destroy();
  }

  private animateAttack(): boolean {
    const attack = this.state.battle.recentAttack;
    if (attack) {
      this.isAttackAnimating = true;
      this.cardStacks.filter(cs => cs.cards.length > 1).forEach(cs => cs.tween());
      const attacker = this.cardStacks.find(cs => cs.uuid == attack.sourceRootUUID);
      if (!attacker?.data.ownedByPlayer) {
        attacker?.animateAttack(attack.sourceSubUUID);
      }
      this.cardStacks.find(cs => cs.uuid == attack.targetUUID)?.animateDamage(attack);
      this.time.delayedCall(animationConfig.duration.attack, () => {
        this.isAttackAnimating = false;
      });
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

  private updateCardStacks() {
    this.cardStacks.forEach(cs => {
      const newData = this.state.cardStacks.find(csd => csd.uuid == cs.uuid);
      if (newData) {
        cs.update(newData);
      } else {
        cs.discard();
      }
    }, this);
    this.state.cardStacks
      .filter(cs => !this.cardStacks.some(csd => csd.uuid == cs.uuid), this)
      .map(cs => {
        let origin: CardImage | undefined;
        if (this.maximizedTacticCard?.cardId == cs.cards[0].id) {
          origin = this.maximizedTacticCard;
          this.maximizedTacticCard = undefined;
        } else {
          origin = this.getPlayerUI(cs.ownedByPlayer).hand.find(h => h.uuid == cs.uuid);
        }
        origin?.destroy();
        const cardStack = new CardStack(this, cs);
        cardStack.init(origin);
        return cardStack;
      }, this)
      .forEach(cs => this.cardStacks.push(cs), this);
    this.cardStacks = this.cardStacks.filter(
      cs => this.state.cardStacks.find(csd => csd.uuid == cs.uuid),
      this
    );
  }

  private updateHandCards(newHandCards: ClientHandCard[]) {
    this.discardMaximizedTacticCard();
    this.forBothPlayers((state, ui) =>
      ui.hand.map(h => {
        const newData = state.hand.find(hcd => hcd.uuid == h.uuid);
        const event = this.getCardMovementEvent(h.uuid);
        if (h.uuid == this.state.highlightCardUUID) h.maximizeTacticCard();
        else if (newData) h.update(newData);
        else if (event?.type == EventType.Discard) h.discard(false, event.playerEvent);
        else h.destroy(); // Card was attached to a card stack in updateCardStacks()
      }, this)
    );
    newHandCards
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
      this.player.hand.forEach(c => {
        if (this.plannedBattle.type != BattleType.None) c.highlightDisabled();
        else if (this.activeCards.hand == c.uuid) c.highlightSelected();
        else if (this.state.turnPhase != TurnPhase.End) c.highlightPlayability();
        else c.highlightSelectable();
      });
      this.cardStacks.forEach(cs => {
        if (this.activeCards.hand) {
          const activeCard = this.player.hand.find(c => c.uuid == this.activeCards.hand);
          if (activeCard && activeCard.data.validTargets.includes(cs.uuid)) cs.highlightSelectable();
        } else {
          const allShips = this.state.battle.playerShipIds.concat(this.state.battle.opponentShipIds);
          switch (this.state.turnPhase) {
            case TurnPhase.Build:
              if (this.plannedBattle.type != BattleType.None) {
                if (this.plannedBattle.shipIds.includes(cs.uuid)) {
                  cs.highlightSelected();
                } else if (cs.data.missionReady) {
                  cs.highlightSelectable();
                }
              } else if (this.state.battle.type != BattleType.None && !this.state.playerIsActive) {
                if (this.interceptShipIds.includes(cs.uuid)) {
                  cs.highlightSelected();
                } else if (cs.data.interceptionReady) {
                  cs.highlightSelectable();
                }
              }
              break;
            case TurnPhase.Combat:
              if (!allShips.includes(cs.uuid)) {
                cs.highlightDisabled();
              }
              if (this.activeCards.stackUUID == cs.uuid && this.activeCards.cardUUID != undefined) {
                cs.cards.find(c => c.data.uuid == this.activeCards.cardUUID)?.highlightSelected();
              } else if (this.state.battle.playerShipIds.includes(cs.uuid)) {
                cs.cards.filter(c => c.data.battleReady).forEach(c => c.highlightSelectable());
              }
              if (this.activeCards.stackUUID && this.state.battle.opponentShipIds.includes(cs.uuid)) {
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
