import Phaser from 'phaser';
import { Subscription } from 'rxjs';
import { EventType } from '@shared/config/enums';
import ClientGameParams from '@shared/interfaces/client_game_params';
import {
  ClientAttack,
  ClientEvent,
  ClientHandCard,
  ClientPlayer,
  ClientState
} from '@shared/interfaces/client_state';
import Background from '../components/background';
import CardImage from '../components/card/card_image';
import CardStack from '../components/card/card_stack';
import DeckCard from '../components/card/deck_card';
import DiscardPile from '../components/card/discard_pile';
import HandCard from '../components/card/hand_card';
import { AssetPreloaderService } from '../services/asset_preloader_service';
import { GameInteractionService } from '../services/game_interaction_service';
import { GameSessionService } from '../services/game_session_service';
import { SERVICE_REGISTRY_KEYS } from '../services/service_registry';

interface InitData {
  gameParams: ClientGameParams;
}

interface PlayerUIElements {
  deck: DeckCard;
  discardPile: DiscardPile;
  hand: Array<HandCard>;
}

/**
 * Thin Phaser scene rendering only the space background, zone markers, interactive
 * card board (`CardStack`, `HandCard`, `DeckCard`, `DiscardPile`), and battle FX,
 * while Angular renders all HUD controls, prompts, and modal overlays.
 */
export default class Game extends Phaser.Scene {
  session!: GameSessionService;
  interaction!: GameInteractionService;
  assetPreloader!: AssetPreloaderService;
  gameParams!: ClientGameParams;

  cardStacks: Array<CardStack> = [];
  maximizedTacticCard?: CardImage;
  private pendingNewHandCards: ClientHandCard[] = [];
  private subscriptions?: Subscription;
  private isShutDown = false;

  background!: Background;
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
    this.isShutDown = false;
    this.session = this.registry.get(SERVICE_REGISTRY_KEYS.gameSession);
    this.interaction = this.registry.get(SERVICE_REGISTRY_KEYS.gameInteraction);
    this.assetPreloader = this.registry.get(SERVICE_REGISTRY_KEYS.assetPreloader);
    this.gameParams = data.gameParams;
    this.pendingNewHandCards = [];
    this.cardStacks = [];
    this.maximizedTacticCard = undefined;
    this.session.initMatch(data.gameParams);
    this.interaction.reset();
  }

  create() {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.isShutDown = true;
      this.subscriptions?.unsubscribe();
      this.subscriptions = undefined;
      this.session.stopSession();
      this.interaction.reset();
    });
    void this.setupBoard();
  }

  /** Refreshes the background orb/ring transition, deck/discard counts, and board highlighting. */
  updateView() {
    this.background.update();
    [this.player, this.opponent].forEach(ui => {
      ui.deck.update();
      ui.discardPile.update();
    });
    this.updateHighlighting();
  }

  /** Returns the board UI elements belonging to the local player or opponent. */
  getPlayerUI(isPlayer: boolean): PlayerUIElements {
    return isPlayer ? this.player : this.opponent;
  }

  /** Returns the player or opponent state slice from `GameSessionService`. */
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

  /** Discards a maximized tactic card preview once the intervention window ends. */
  discardMaximizedTacticCard() {
    if (!this.session.state.intervention) {
      this.maximizedTacticCard?.discard();
      this.maximizedTacticCard = undefined;
    }
  }

  private async setupBoard(): Promise<void> {
    await this.assetPreloader.preloadMatch(this.gameParams.preloadCardIds);
    if (this.isShutDown) return;
    this.assetPreloader.registerPhaserTextures(this.textures);

    this.background = new Background(this);
    this.background.initInterface();
    this.opponent = {
      deck: new DeckCard(this, false),
      discardPile: new DiscardPile(this, false),
      hand: []
    };
    this.player = {
      deck: new DeckCard(this, true),
      discardPile: new DiscardPile(this, true),
      hand: []
    };
    this.bindServices();
    this.session.startSession();
  }

  private bindServices(): void {
    this.subscriptions?.unsubscribe();
    const sub = new Subscription();

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
      this.interaction.viewChanged$.subscribe(() => {
        this.updateView();
      })
    );
    sub.add(
      this.interaction.returnToMatchmaking$.subscribe(() => {
        this.scene.start('Matchmaking');
      })
    );

    this.subscriptions = sub;
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
