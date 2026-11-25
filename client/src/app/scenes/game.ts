import Phaser from 'phaser';
import { Subscription } from 'rxjs';
import { EventType } from '@shared/config/enums';
import ClientGameParams from '@shared/interfaces/client_game_params';
import {
  ClientAttack,
  ClientEvent,
  ClientGameResult,
  ClientHandCard,
  ClientPlayer,
  ClientState
} from '@shared/interfaces/client_state';
import ActionPool from '../components/action_pool';
import Background from '../components/background';
import ContinueButton from '../components/buttons/continue_button';
import ExitButton from '../components/buttons/exit_button';
import MissionButton from '../components/buttons/mission_button';
import RaidButton from '../components/buttons/raid_button';
import CardImage from '../components/card/card_image';
import CardStack from '../components/card/card_stack';
import DeckCard from '../components/card/deck_card';
import DiscardPile from '../components/card/discard_pile';
import HandCard from '../components/card/hand_card';
import ZoomCard from '../components/card/zoom_card';
import CombatRangeIndicator from '../components/indicators/combat_range_indicator';
import CountdownIndicator from '../components/indicators/countdown_indicator';
import GameOverIndicator from '../components/indicators/game_over_indicator';
import OptionPicker from '../components/option_picker';
import Preloader from '../components/preloader';
import { designConfig } from '../config/design';
import { layoutConfig } from '../config/layout';
import { rules } from '@shared/config/rules';
import { GameInteractionService, PendingOptionPickerState } from '../services/game_interaction_service';
import { GameSessionService } from '../services/game_session_service';
import { SERVICE_REGISTRY_KEYS } from '../services/service_registry';
import { loadCardResources, loadPreloadableResources } from './resource-loader';

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
  session!: GameSessionService;
  interaction!: GameInteractionService;
  gameParams!: ClientGameParams;
  preloader!: Preloader;

  cardStacks: Array<CardStack> = [];
  maximizedTacticCard?: CardImage;
  private gameOverIndicator?: GameOverIndicator;
  private connectionLostShown = false;
  private pendingNewHandCards: ClientHandCard[] = [];
  private subscriptions?: Subscription;

  background!: Background;
  obj!: FixedUIElements;
  player!: PlayerUIElements;
  opponent!: PlayerUIElements;

  constructor() {
    super({
      key: 'Game'
    });
  }

  /** Authoritative client game state owned by `GameSessionService`. */
  get state(): ClientState {
    return this.session.state;
  }

  /** Whether a mid-game connection loss was reported by `GameSessionService`. */
  get connectionLost(): boolean {
    return this.session.connectionLost;
  }

  init(data: InitData) {
    this.session = this.registry.get(SERVICE_REGISTRY_KEYS.gameSession);
    this.interaction = this.registry.get(SERVICE_REGISTRY_KEYS.gameInteraction);
    this.gameParams = data.gameParams;
    // Phaser reuses the scene instance for the next match, so reset view state
    // to allow fresh overlays in the new game.
    this.gameOverIndicator = undefined;
    this.connectionLostShown = false;
    this.pendingNewHandCards = [];
    this.cardStacks = [];
    this.maximizedTacticCard = undefined;
    this.session.initMatch(data.gameParams);
    this.interaction.reset();
    this.background = new Background(this);
  }

  preload() {
    this.preloader = new Preloader(this);
    loadPreloadableResources(this.load);
    loadCardResources(this.load, this.gameParams.preloadCardIds);
  }

  create() {
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
    this.bindServices();
    this.session.startSession();
  }

  /**
   * Shows the game over overlay for the given result exactly once per game.
   * Any later call is ignored, so exactly one overlay exists regardless of how many updates arrive.
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
    if (this.connectionLostShown || this.session.state.gameResult) return;
    this.connectionLostShown = true;
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
    return this.session.getPlayerState(isPlayer);
  }

  /**
   * Returns the card movement event (retract or discard) reported by the server for the card
   * with the given UUID.
   */
  getCardMovementEvent(cardUUID: string): ClientEvent | undefined {
    return this.session.getCardMovementEvent(cardUUID);
  }

  discardMaximizedTacticCard() {
    if (!this.session.state.intervention) {
      this.maximizedTacticCard?.discard();
      this.maximizedTacticCard = undefined;
    }
  }

  private bindServices(): void {
    this.subscriptions?.unsubscribe();
    const sub = new Subscription();

    sub.add(
      this.session.stateReceived$.subscribe(() => {
        this.preloader?.destroy();
      })
    );
    sub.add(
      this.session.attackAnimation$.subscribe(attack => {
        this.animateAttack(attack);
      })
    );
    sub.add(
      this.session.syncBoardStep$.subscribe(() => {
        this.pendingNewHandCards = this.newHandCards;
        this.updateCardStacks();
      })
    );
    sub.add(
      this.session.syncHandStep$.subscribe(() => {
        this.updateHandCards(this.pendingNewHandCards);
        this.pendingNewHandCards = [];
      })
    );
    sub.add(
      this.session.syncViewStep$.subscribe(() => {
        this.updateView();
        this.highlightAttackIntervention();
      })
    );
    sub.add(
      this.session.syncDiscardPilesStep$.subscribe(({ player, opponent }) => {
        this.player.discardPile.update(player);
        this.opponent.discardPile.update(opponent);
      })
    );
    sub.add(
      this.session.countdown$.subscribe(({ player, opponent }) => {
        this.player.countdownIndicator.update(player);
        this.opponent.countdownIndicator.update(opponent);
      })
    );
    sub.add(
      this.session.connectionLost$.subscribe(lost => {
        if (lost) {
          this.showConnectionLostMessage();
        }
      })
    );
    sub.add(
      this.interaction.viewChanged$.subscribe(() => {
        this.updateView();
      })
    );
    sub.add(
      this.interaction.pendingOptionPicker$.subscribe(picker => {
        this.syncOptionPicker(picker);
      })
    );

    this.subscriptions = sub;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.subscriptions?.unsubscribe();
      this.subscriptions = undefined;
      this.session.stopSession();
      this.interaction.reset();
    });
  }

  private syncOptionPicker(picker: PendingOptionPickerState | undefined): void {
    if (!picker) {
      this.obj?.optionPicker?.destroy();
      return;
    }
    if (
      !this.obj?.optionPicker ||
      this.obj.optionPicker.handCardUUID !== picker.handCardUUID ||
      this.obj.optionPicker.targetUUID !== picker.targetUUID
    ) {
      this.obj?.optionPicker?.destroy();
      new OptionPicker(this, picker.handCardUUID, picker.targetUUID, picker.options, picker.optionsToSelect);
    } else {
      this.obj.optionPicker.sync();
    }
  }

  private animateAttack(attack: ClientAttack): void {
    this.cardStacks.filter(cs => cs.cards.length > 1).forEach(cs => cs.tween());
    const attacker = this.cardStacks.find(cs => cs.uuid == attack.sourceRootUUID);
    if (!attacker?.data.ownedByPlayer) {
      attacker?.animateAttack(attack.sourceSubUUID);
    }
    this.cardStacks.find(cs => cs.uuid == attack.targetUUID)?.animateDamage(attack);
  }

  private highlightAttackIntervention() {
    const intervention = this.session.state.intervention?.attack;
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
      const newData = this.session.state.cardStacks.find(csd => csd.uuid == cs.uuid);
      if (newData) {
        cs.update(newData);
      } else {
        cs.discard();
      }
    }, this);
    this.session.state.cardStacks
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
      cs => this.session.state.cardStacks.find(csd => csd.uuid == cs.uuid),
      this
    );
  }

  private updateHandCards(newHandCards: ClientHandCard[]) {
    this.discardMaximizedTacticCard();
    this.forBothPlayers((state, ui) =>
      ui.hand.map(h => {
        const newData = state.hand.find(hcd => hcd.uuid == h.uuid);
        const event = this.getCardMovementEvent(h.uuid);
        if (h.uuid == this.session.state.highlightCardUUID) h.maximizeTacticCard();
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

    this.player.hand.forEach(c => {
      switch (this.interaction.getHandCardHighlight(c.data)) {
        case 'disabled':
          c.highlightDisabled();
          break;
        case 'selected':
          c.highlightSelected();
          break;
        case 'selectable':
          c.highlightSelectable();
          break;
        default:
          c.highlightReset();
      }
    });

    this.cardStacks.forEach(cs => {
      const { stackHighlight, cardHighlights } = this.interaction.getCardStackHighlight(cs.data);
      if (stackHighlight == 'disabled') {
        cs.highlightDisabled();
      }
      cardHighlights.forEach((highlight, cardUUID) => {
        const card = cs.cards.find(c => c.data.uuid == cardUUID);
        if (highlight == 'selected') card?.highlightSelected();
        else if (highlight == 'selectable') card?.highlightSelectable();
      });
      if (stackHighlight == 'selectable') cs.highlightSelectable();
      else if (stackHighlight == 'selected') cs.highlightSelected();
    });
  }
}
