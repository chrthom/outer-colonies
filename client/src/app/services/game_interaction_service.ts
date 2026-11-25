import { Injectable, OnDestroy, inject } from '@angular/core';
import { constants } from '@shared/config/constants';
import { BattleType, InterventionType, TurnPhase } from '@shared/config/enums';
import { rules } from '@shared/config/rules';
import ClientPlannedBattle, { ClientPlannedBattleHelper } from '@shared/interfaces/client_planned_battle';
import { ClientCardStack, ClientHandCard, ClientState } from '@shared/interfaces/client_state';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { animationConfig } from '../config/animation';
import { SocketService } from '../socket_service';
import { GameSessionService } from './game_session_service';
import { SchedulerService } from './scheduler_service';

/** Currently selected cards on the client board/hand. */
export interface ActiveCards {
  hand?: string;
  stackUUID?: string;
  cardUUID?: string;
}

/** Visual highlight state derived for a hand card, stack, or board card. */
export type CardHighlightState = 'none' | 'disabled' | 'selectable' | 'selected';

/** Highlight state derived for a board stack and each of its member cards. */
export interface CardStackHighlightState {
  stackHighlight: CardHighlightState;
  cardHighlights: Map<string, CardHighlightState>;
}

/** Derived view-model for the phase/intervention prompt. */
export interface PromptViewModel {
  text: string;
  visible: boolean;
  autoHide: boolean;
  isGameOver: boolean;
}

/** Derived view-model for the primary continue/action button. */
export interface ContinueButtonViewModel {
  text: string;
  buttonKey: string;
  enabled: boolean;
  isGameOver: boolean;
}

/** Derived view-model for the exit/surrender button. */
export interface ExitButtonViewModel {
  label: string;
  canSurrender: boolean;
}

/** Authoritative state of an open option picker modal. */
export interface PendingOptionPickerState {
  handCardUUID: string;
  targetUUID: string;
  options: number[];
  optionsToSelect: number;
  selectedIndexes: number[];
  currentPage: number;
}

/** Derived pagination and selection view-model for an open option picker. */
export interface OptionPickerViewModel {
  handCardUUID: string;
  targetUUID: string;
  optionsToSelect: number;
  selectedIndexes: number[];
  currentPage: number;
  maxPage: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  allOptionsSelected: boolean;
  selectedOptionsText: string;
  visibleOptions: Array<{ absoluteIndex: number; cardId: number; selected: boolean }>;
}

/** Automatic Ready message a pending player emits when unable to act. */
interface AutoReadyAction {
  delay: number;
  emit: () => void;
}

/**
 * Renderer-agnostic service owning client interaction state (selected cards,
 * planned battle, interception ships, pending option picker), user intent
 * dispatch, auto-ready scheduling, and derived UI view-model state.
 */
@Injectable({ providedIn: 'root' })
export class GameInteractionService implements OnDestroy {
  private static readonly OPTIONS_PER_PAGE = 3;

  activeCards: ActiveCards = {};
  plannedBattle: ClientPlannedBattle = ClientPlannedBattleHelper.empty;
  interceptShipIds: string[] = [];

  private readonly viewChangedSubject = new Subject<void>();
  private readonly pendingOptionPickerSubject = new BehaviorSubject<PendingOptionPickerState | undefined>(
    undefined
  );

  /** Emits whenever local interaction state changes and the view should refresh. */
  readonly viewChanged$: Observable<void> = this.viewChangedSubject.asObservable();
  /** Emits the current pending option picker state, or `undefined` when closed. */
  readonly pendingOptionPicker$: Observable<PendingOptionPickerState | undefined> =
    this.pendingOptionPickerSubject.asObservable();

  private readonly gameSession = inject(GameSessionService);
  private readonly socketService = inject(SocketService);
  private readonly scheduler = inject(SchedulerService);

  private autoReadyCancel?: () => void;
  private autoReadyState?: ClientState;
  private readonly subscriptions = new Subscription();

  constructor() {
    this.subscriptions.add(
      this.gameSession.stateReceived$.subscribe(state => {
        this.resetSelection();
        this.cancelPendingAutoReady();
        const picker = this.pendingOptionPickerSubject.value;
        if (picker && !this.isOptionPickerValidFor(state, picker)) {
          this.pendingOptionPickerSubject.next(undefined);
        }
      })
    );
    this.subscriptions.add(
      this.gameSession.syncViewStep$.subscribe(() => {
        this.syncAutoReady();
      })
    );
    this.subscriptions.add(
      this.gameSession.connectionLost$.subscribe(lost => {
        if (lost) {
          this.cancelPendingAutoReady();
          if (this.pendingOptionPickerSubject.value) {
            this.pendingOptionPickerSubject.next(undefined);
          }
        }
      })
    );
  }

  /** Currently active option picker state, if any. */
  get pendingOptionPicker(): PendingOptionPickerState | undefined {
    return this.pendingOptionPickerSubject.value;
  }

  /**
   * Resets all local selection state, pending option picker, and auto-ready timers.
   *
   * @param battleType Optional battle type to preserve or activate after resetting.
   */
  reset(battleType?: BattleType): void {
    this.resetSelection(battleType);
    this.cancelPendingAutoReady();
    if (this.pendingOptionPickerSubject.value) {
      this.pendingOptionPickerSubject.next(undefined);
    }
    this.viewChangedSubject.next();
  }

  /**
   * Resets card/battle selection state without cancelling an open option picker.
   *
   * @param battleType Optional battle type to keep or select.
   */
  resetSelection(battleType?: BattleType): void {
    this.activeCards = {};
    this.interceptShipIds = [];
    this.plannedBattle = ClientPlannedBattleHelper.empty;
    if (battleType !== undefined) {
      this.plannedBattle.type = battleType;
    }
  }

  /**
   * Handles clicking one of the player's hand cards: selects/deselects a playable
   * card or discards it during the end phase.
   */
  clickHandCard(uuid: string): void {
    const state = this.gameSession.state;
    if (!state.playerPendingAction) return;
    const card = state.player.hand.find(h => h.uuid == uuid);
    if (!card) return;

    if (card.playable && (state.turnPhase != TurnPhase.Build || this.plannedBattle.type == BattleType.None)) {
      const reset = this.activeCards.hand == uuid;
      this.activeCards.stackUUID = undefined;
      this.activeCards.cardUUID = undefined;
      this.activeCards.hand = reset ? undefined : uuid;
      this.viewChangedSubject.next();
    } else if (state.turnPhase == TurnPhase.End) {
      this.socketService.emitDiscard(uuid);
    }
  }

  /**
   * Handles clicking a card stack (or a specific card inside a stack) on the board:
   * plays a selected hand card, opens an option picker, toggles battle/intercept
   * ships, selects a weapon, or executes an attack.
   */
  clickCardStack(stackUUID: string, cardUUID?: string): void {
    const state = this.gameSession.state;
    if (!state.playerPendingAction) return;

    const stack = state.cardStacks.find(cs => cs.uuid == stackUUID);
    const cardData = cardUUID !== undefined ? stack?.cards.find(c => c.uuid == cardUUID) : undefined;

    if (state.intervention) {
      if (this.activeCards.hand) {
        this.socketService.emitHandcard(this.activeCards.hand, stackUUID);
      }
    } else {
      switch (state.turnPhase) {
        case TurnPhase.Build:
          if (state.playerIsActive) {
            if (this.activeCards.hand) {
              const handCard = state.player.hand.find(h => h.uuid == this.activeCards.hand);
              if (handCard?.options) {
                this.openOptionPicker(
                  this.activeCards.hand,
                  stackUUID,
                  handCard.options,
                  handCard.optionsToSelect
                );
              } else {
                this.socketService.emitHandcard(this.activeCards.hand, stackUUID);
              }
            } else if (this.plannedBattle.type != BattleType.None && stack?.missionReady) {
              if (this.plannedBattle.shipIds.includes(stackUUID)) {
                this.plannedBattle.shipIds = this.plannedBattle.shipIds.filter(id => id != stackUUID);
              } else {
                this.plannedBattle.shipIds.push(stackUUID);
              }
            }
          } else if (stack?.missionReady) {
            if (this.interceptShipIds.includes(stackUUID)) {
              this.interceptShipIds = this.interceptShipIds.filter(id => id != stackUUID);
            } else if (stack.interceptionReady) {
              this.interceptShipIds.push(stackUUID);
            }
          }
          break;
        case TurnPhase.Combat:
          if (
            cardData !== undefined &&
            this.activeCards.stackUUID == stackUUID &&
            this.activeCards.cardUUID == cardData.uuid
          ) {
            this.activeCards.stackUUID = undefined;
            this.activeCards.cardUUID = undefined;
            this.activeCards.hand = undefined;
          } else if (cardData?.battleReady) {
            this.activeCards.stackUUID = stackUUID;
            this.activeCards.cardUUID = cardData.uuid;
            this.activeCards.hand = undefined;
          } else if (stack && this.canPerformAllAttackOnBase(stack)) {
            this.socketService.emitAttack(constants.attackAllID, constants.attackAllID, stackUUID);
          } else if (
            this.activeCards.stackUUID &&
            this.activeCards.cardUUID &&
            state.battle.opponentShipIds.includes(stackUUID)
          ) {
            this.socketService.emitAttack(this.activeCards.stackUUID, this.activeCards.cardUUID, stackUUID);
          }
          break;
      }
    }
    this.viewChangedSubject.next();
  }

  /**
   * Emits a card retraction intent for the given stack and member card.
   */
  retractCard(stackUUID: string, cardUUID: string): void {
    this.socketService.emitRetract(stackUUID, cardUUID);
  }

  /**
   * Toggles planning a mission or raid in the build phase and resets selection.
   */
  togglePlannedBattle(battleType: BattleType): void {
    const nextType = this.plannedBattle.type == battleType ? BattleType.None : battleType;
    this.resetSelection(nextType);
    this.viewChangedSubject.next();
  }

  /**
   * Executes the primary continue/ready action for the current state, or returns
   * `'matchmaking'` when the match is over and the player requests a new opponent.
   */
  continueAction(): 'matchmaking' | 'none' {
    const state = this.gameSession.state;
    if (state.gameResult) {
      this.cancelAutoReadyTimer();
      return 'matchmaking';
    }
    if (!state.playerPendingAction) return 'none';

    if (state.intervention) {
      this.autoReadyState = state;
      this.cancelAutoReadyTimer();
      this.socketService.emitReady(state.turnPhase);
      return 'none';
    }

    switch (state.turnPhase) {
      case TurnPhase.Build:
        if (!state.playerIsActive) {
          this.autoReadyState = state;
          this.cancelAutoReadyTimer();
          this.socketService.emitReady(TurnPhase.Build, this.interceptShipIds);
        } else if (!state.player.hasToRetractCards) {
          this.autoReadyState = state;
          this.cancelAutoReadyTimer();
          this.socketService.emitReady(TurnPhase.Build, this.plannedBattle);
        }
        break;
      case TurnPhase.Combat:
        this.autoReadyState = state;
        this.cancelAutoReadyTimer();
        this.socketService.emitReady(TurnPhase.Combat);
        break;
    }
    return 'none';
  }

  /**
   * Emits a surrender intent for the current match.
   */
  surrender(): void {
    this.socketService.emitSurrender();
  }

  /**
   * Opens the option picker for a hand card to be played on a target stack.
   */
  openOptionPicker(
    handCardUUID: string,
    targetUUID: string,
    options: number[],
    optionsToSelect: number
  ): void {
    this.pendingOptionPickerSubject.next({
      handCardUUID,
      targetUUID,
      options: [...options],
      optionsToSelect,
      selectedIndexes: [],
      currentPage: 1
    });
  }

  /**
   * Toggles selection of an option card by its absolute index in `options`.
   */
  toggleOptionPickerSelection(index: number): void {
    const picker = this.pendingOptionPickerSubject.value;
    if (!picker || index < 0 || index >= picker.options.length) return;

    let nextSelected: number[];
    if (picker.selectedIndexes.includes(index)) {
      nextSelected = picker.selectedIndexes.filter(i => i != index);
    } else if (picker.selectedIndexes.length < picker.optionsToSelect) {
      nextSelected = [...picker.selectedIndexes, index];
    } else {
      return;
    }
    this.pendingOptionPickerSubject.next({
      ...picker,
      selectedIndexes: nextSelected
    });
  }

  /**
   * Moves the option picker pagination by `delta` pages if within bounds.
   */
  moveOptionPickerPage(delta: number): void {
    const picker = this.pendingOptionPickerSubject.value;
    if (!picker) return;
    const maxPage = this.computeMaxPage(picker.options.length);
    const nextPage = picker.currentPage + delta;
    if (nextPage > 0 && nextPage <= maxPage) {
      this.pendingOptionPickerSubject.next({
        ...picker,
        currentPage: nextPage
      });
    }
  }

  /**
   * Confirms the pending option picker if all required options are selected,
   * emitting the `Handcard` intent with the captured card/target UUIDs.
   *
   * @returns `true` if confirmed and emitted, `false` otherwise.
   */
  confirmOptionPicker(): boolean {
    const picker = this.pendingOptionPickerSubject.value;
    if (!picker || picker.selectedIndexes.length != picker.optionsToSelect) {
      return false;
    }
    const selectedCardIds = picker.selectedIndexes.map(i => picker.options[i]);
    this.pendingOptionPickerSubject.next(undefined);
    this.socketService.emitHandcard(picker.handCardUUID, picker.targetUUID, selectedCardIds);
    return true;
  }

  /**
   * Cancels the pending option picker without emitting anything and clears the
   * selected hand card.
   */
  cancelOptionPicker(): void {
    if (this.pendingOptionPickerSubject.value) {
      this.pendingOptionPickerSubject.next(undefined);
    }
    this.activeCards.hand = undefined;
    this.viewChangedSubject.next();
  }

  /**
   * Whether the pending option picker action is still valid for the given state.
   */
  isOptionPickerValidFor(
    state: ClientState,
    picker: PendingOptionPickerState | undefined = this.pendingOptionPickerSubject.value
  ): boolean {
    if (!picker) return false;
    return (
      state.playerPendingAction &&
      !state.intervention &&
      !state.gameResult &&
      state.turnPhase == TurnPhase.Build &&
      state.playerIsActive &&
      state.cardStacks.some(cs => cs.uuid == picker.targetUUID) &&
      state.player.hand.some(
        h => h.uuid == picker.handCardUUID && h.playable && h.validTargets.includes(picker.targetUUID)
      )
    );
  }

  /**
   * Returns the derived view-model for the currently open option picker, or `undefined`.
   */
  getOptionPickerViewModel(): OptionPickerViewModel | undefined {
    const picker = this.pendingOptionPickerSubject.value;
    if (!picker) return undefined;

    const maxPage = this.computeMaxPage(picker.options.length);
    const start = (picker.currentPage - 1) * GameInteractionService.OPTIONS_PER_PAGE;
    const end = picker.currentPage * GameInteractionService.OPTIONS_PER_PAGE;
    const visibleOptions = picker.options.slice(start, end).map((cardId, relIndex) => {
      const absoluteIndex = start + relIndex;
      return {
        absoluteIndex,
        cardId,
        selected: picker.selectedIndexes.includes(absoluteIndex)
      };
    });

    return {
      handCardUUID: picker.handCardUUID,
      targetUUID: picker.targetUUID,
      optionsToSelect: picker.optionsToSelect,
      selectedIndexes: picker.selectedIndexes,
      currentPage: picker.currentPage,
      maxPage,
      hasPreviousPage: picker.currentPage > 1,
      hasNextPage: picker.currentPage < maxPage,
      allOptionsSelected: picker.selectedIndexes.length == picker.optionsToSelect,
      selectedOptionsText:
        `${picker.selectedIndexes.length}/${picker.optionsToSelect} Karten ausgewählt - ` +
        `zeige Seite ${picker.currentPage}/${maxPage}`,
      visibleOptions
    };
  }

  /**
   * Schedules or cancels automatic Ready emissions for a pending player who can
   * neither intercept (build) nor attack (combat), at most once per state.
   */
  syncAutoReady(): void {
    const state = this.gameSession.state;
    const autoReady = this.getPendingAutoReady(state);
    if (!autoReady) {
      this.cancelPendingAutoReady();
    } else if (this.autoReadyState !== state) {
      this.cancelPendingAutoReady();
      this.autoReadyState = state;
      this.autoReadyCancel = this.scheduler.schedule(autoReady.delay, () => {
        this.autoReadyCancel = undefined;
        autoReady.emit();
      });
    }
  }

  /**
   * Computes the derived prompt text and visibility behaviour for the current state.
   */
  getPromptState(): PromptViewModel {
    const state = this.gameSession.state;
    if (state.gameResult) {
      return { text: '', visible: false, autoHide: false, isGameOver: true };
    }
    if (!state.playerPendingAction) {
      const waitingText = 'Warte auf Gegenspieler...';
      // Only name the phase while the opponent is active; when the player is active and just waits
      // for a reaction, the opponent's phase would be ambiguous.
      const phaseText = state.playerIsActive ? undefined : this.opponentPhaseText(state.turnPhase);
      return {
        text: phaseText ? `${waitingText}\nGegner: ${phaseText}` : waitingText,
        visible: true,
        autoHide: true,
        isGameOver: false
      };
    }
    if (state.intervention) {
      return {
        text:
          'Unterbreche den gegnerischen Zug durch das\n' +
          'Spielen einer Taktikkarte mit der\n' +
          'Eigenschaft "Intervention"!',
        visible: true,
        autoHide: true,
        isGameOver: false
      };
    }

    switch (state.turnPhase) {
      case TurnPhase.Build:
        if (state.playerIsActive) {
          let text: string;
          if (state.player.hasToRetractCards) {
            text = 'Einige deiner Karten haben nicht genügend\nEnergie.\nNimm sie auf die Hand zurück!';
          } else if (this.plannedBattle.type == BattleType.None) {
            text =
              'Spiele Karten von deiner Hand aus.\n' +
              'Plane dann eine Mission oder Überfall.\n\n' +
              'Klicke die gegnerische Kolonie für\n' +
              'einen Überfall bzw. dein Deck oder\n' +
              'Ablagestapel für eine Mission.';
          } else {
            text = `Wähle Schiffe für ${
              this.plannedBattle.type == BattleType.Raid ? 'den Überfall' : 'die Mission'
            }!`;
          }
          return { text, visible: false, autoHide: false, isGameOver: false };
        }
        return {
          text: `Wähle Schiffe ${
            state.battle.type == BattleType.Raid
              ? 'zur Verteidigung\ndeiner Kolonie'
              : 'zum Abfangen der\ngegenerischen Mission'
          }!`,
          visible: false,
          autoHide: false,
          isGameOver: false
        };
      case TurnPhase.Combat:
        return {
          text: `Aktuelle Reichweite des Gefechts: ${state.battle.range}\nFühre Angriffe mit deinen\nWaffensystemen durch!`,
          visible: false,
          autoHide: false,
          isGameOver: false
        };
      case TurnPhase.End: {
        const cardsToDrop = state.player.hand.length - state.player.handCardLimit;
        return {
          text: `Handkartenlimit um ${cardsToDrop} überschritten;\nLege überzählige Karten ab!`,
          visible: true,
          autoHide: true,
          isGameOver: false
        };
      }
      default:
        return { text: 'Lädt...', visible: false, autoHide: false, isGameOver: false };
    }
  }

  /**
   * Computes the derived view-model for the continue button.
   */
  getContinueButtonState(): ContinueButtonViewModel {
    const state = this.gameSession.state;
    if (state.gameResult) {
      return {
        text: 'Neuen Gegner suchen',
        buttonKey: state.gameResult.won ? 'won' : 'lost',
        enabled: true,
        isGameOver: true
      };
    }
    if (!state.playerPendingAction) {
      return {
        text: '',
        buttonKey: `${state.playerIsActive ? '' : 'in'}active_wait`,
        enabled: false,
        isGameOver: false
      };
    }
    if (state.intervention) {
      return {
        text: 'Überspringen',
        buttonKey: `${state.playerIsActive ? '' : 'in'}active_select`,
        enabled: true,
        isGameOver: false
      };
    }

    switch (state.turnPhase) {
      case TurnPhase.Build:
        if (!state.playerIsActive) {
          let text: string;
          if (state.battle.type == BattleType.Raid) text = 'Verteidigung beginnen';
          else if (this.interceptShipIds.length > 0) text = 'Abfangen';
          else text = 'Überspringen';
          return { text, buttonKey: 'inactive_select', enabled: true, isGameOver: false };
        }
        if (state.player.hasToRetractCards) {
          return { text: '', buttonKey: 'active_wait', enabled: false, isGameOver: false };
        }
        return {
          text:
            this.plannedBattle.shipIds.length == 0
              ? 'Zug beenden'
              : `${this.plannedBattle.type == BattleType.Mission ? 'Mission' : 'Überfall'} durchführen`,
          buttonKey: 'active_build',
          enabled: true,
          isGameOver: false
        };
      case TurnPhase.Combat:
        return {
          text: 'Kampfphase beenden',
          buttonKey: `${state.playerIsActive ? '' : 'in'}active_combat`,
          enabled: true,
          isGameOver: false
        };
      case TurnPhase.End:
        return {
          text: 'Karten ablegen',
          buttonKey: 'active_select',
          enabled: false,
          isGameOver: false
        };
      default:
        return {
          text: '',
          buttonKey: `${state.playerIsActive ? '' : 'in'}active_wait`,
          enabled: false,
          isGameOver: false
        };
    }
  }

  /**
   * Whether the mission/raid declaration buttons should be visible.
   */
  canShowBattleActionButtons(): boolean {
    const state = this.gameSession.state;
    return (
      state.playerPendingAction &&
      state.playerIsActive &&
      state.turnPhase === TurnPhase.Build &&
      !this.activeCards.hand &&
      state.cardStacks.some(stack => stack.ownedByPlayer && stack.missionReady)
    );
  }

  /**
   * Computes the derived label and surrender capability for the game exit button.
   */
  getExitButtonState(): ExitButtonViewModel {
    const canSurrender = !this.gameSession.state.gameResult && !this.gameSession.connectionLost;
    return {
      label: canSurrender ? 'Aufgeben' : 'Spiel beenden',
      canSurrender
    };
  }

  /**
   * Returns the combat range to display, or `undefined` when the indicator should be hidden.
   */
  getVisibleCombatRange(): number | undefined {
    const state = this.gameSession.state;
    if (
      // The server encodes "no battle" as rules.maxRange + 1
      state.battle.range < rules.maxRange + 1 &&
      state.intervention?.rootType != InterventionType.BattleRoundEnd
    ) {
      return state.battle.range;
    }
    return undefined;
  }

  /**
   * Whether clicking the given stack performs an all-out attack on the opponent colony.
   */
  canPerformAllAttackOnBase(stack: ClientCardStack): boolean {
    const isOpponentColony = !stack.ownedByPlayer && stack.cards.slice(-1).pop()?.id == constants.colonyID;
    return (
      isOpponentColony &&
      this.gameSession.state.battle.range == 1 &&
      !this.activeCards.stackUUID &&
      !this.activeCards.hand
    );
  }

  /**
   * Whether hovering over a board stack should expand it.
   */
  isStackExpandableOnHover(): boolean {
    return !this.activeCards.hand && !this.activeCards.stackUUID && !this.gameSession.isAttackAnimating;
  }

  /**
   * Computes the visual highlight state for a player hand card.
   */
  getHandCardHighlight(card: ClientHandCard): CardHighlightState {
    const state = this.gameSession.state;
    if (!state.playerPendingAction || !card.ownedByPlayer) return 'none';
    if (this.plannedBattle.type != BattleType.None) return 'disabled';
    if (this.activeCards.hand == card.uuid) return 'selected';
    if (state.turnPhase != TurnPhase.End) return card.playable ? 'selectable' : 'none';
    return 'selectable';
  }

  /**
   * Computes the visual highlight state for a board card stack and its individual cards.
   */
  getCardStackHighlight(stack: ClientCardStack): CardStackHighlightState {
    const state = this.gameSession.state;
    const cardHighlights = new Map<string, CardHighlightState>();
    let stackHighlight: CardHighlightState = 'none';

    if (!state.playerPendingAction) {
      return { stackHighlight, cardHighlights };
    }

    if (this.activeCards.hand) {
      const activeCard = state.player.hand.find(c => c.uuid == this.activeCards.hand);
      if (activeCard && activeCard.validTargets.includes(stack.uuid)) {
        stackHighlight = 'selectable';
      }
      return { stackHighlight, cardHighlights };
    }

    switch (state.turnPhase) {
      case TurnPhase.Build:
        if (this.plannedBattle.type != BattleType.None) {
          if (this.plannedBattle.shipIds.includes(stack.uuid)) {
            stackHighlight = 'selected';
          } else if (stack.missionReady) {
            stackHighlight = 'selectable';
          }
        } else if (state.battle.type != BattleType.None && !state.playerIsActive) {
          if (this.interceptShipIds.includes(stack.uuid)) {
            stackHighlight = 'selected';
          } else if (stack.interceptionReady) {
            stackHighlight = 'selectable';
          }
        }
        break;
      case TurnPhase.Combat: {
        const allShips = state.battle.playerShipIds.concat(state.battle.opponentShipIds);
        if (!allShips.includes(stack.uuid)) {
          stackHighlight = 'disabled';
        }
        if (this.activeCards.stackUUID == stack.uuid && this.activeCards.cardUUID != undefined) {
          cardHighlights.set(this.activeCards.cardUUID, 'selected');
        } else if (state.battle.playerShipIds.includes(stack.uuid)) {
          stack.cards.filter(c => c.battleReady).forEach(c => cardHighlights.set(c.uuid, 'selectable'));
        }
        if (this.activeCards.stackUUID && state.battle.opponentShipIds.includes(stack.uuid)) {
          stackHighlight = 'selectable';
        } else if (this.canPerformAllAttackOnBase(stack)) {
          stackHighlight = 'selected';
        }
        break;
      }
    }

    return { stackHighlight, cardHighlights };
  }

  ngOnDestroy(): void {
    this.cancelPendingAutoReady();
    this.subscriptions.unsubscribe();
  }

  private cancelPendingAutoReady(): void {
    this.cancelAutoReadyTimer();
    this.autoReadyState = undefined;
  }

  private cancelAutoReadyTimer(): void {
    this.autoReadyCancel?.();
    this.autoReadyCancel = undefined;
  }

  private getPendingAutoReady(state: ClientState): AutoReadyAction | undefined {
    if (
      state.gameResult ||
      !state.playerPendingAction ||
      state.intervention ||
      this.gameSession.connectionLost
    ) {
      return undefined;
    }
    switch (state.turnPhase) {
      case TurnPhase.Build:
        return !state.playerIsActive && !this.canIntercept(state)
          ? {
              delay: animationConfig.duration.move,
              emit: () => this.socketService.emitReady(TurnPhase.Build, [])
            }
          : undefined;
      case TurnPhase.Combat:
        return !this.canAttack(state)
          ? {
              delay: animationConfig.duration.attack,
              emit: () => this.socketService.emitReady(TurnPhase.Combat)
            }
          : undefined;
      default:
        return undefined;
    }
  }

  private canIntercept(state: ClientState): boolean {
    return state.cardStacks.filter(cs => cs.ownedByPlayer).some(cs => cs.interceptionReady);
  }

  private canAttack(state: ClientState): boolean {
    return state.cardStacks
      .filter(cs => state.battle.playerShipIds.includes(cs.uuid))
      .some(cs => cs.cards.some(c => c.battleReady));
  }

  private opponentPhaseText(turnPhase: TurnPhase): string | undefined {
    switch (turnPhase) {
      case TurnPhase.Start:
        return 'Startphase';
      case TurnPhase.Build:
        return 'Aufbauphase (Karten ausspielen,\nMission oder Überfall planen)';
      case TurnPhase.Combat:
        return 'Gefechtsphase';
      case TurnPhase.End:
        return 'Endphase (überzählige Handkarten ablegen)';
      default:
        return undefined;
    }
  }

  private computeMaxPage(totalOptions: number): number {
    return Math.floor((totalOptions - 1) / GameInteractionService.OPTIONS_PER_PAGE) + 1;
  }
}
