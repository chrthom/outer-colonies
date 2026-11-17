import { Socket } from 'socket.io';
import { CardType, InterventionType, TacticDiscipline, TurnPhase, Zone } from '../../shared/config/enums';
import { constants } from '../../shared/config/constants';
import Card from '../cards/card';
import CardStack, { RootCardStack } from '../cards/card_stack';
import { CardProfileConfig } from '../cards/card_profile';
import TacticCard from '../cards/types/tactic_card';
import Match from '../game_state/match';
import Player from '../game_state/player';
import toClientState from './client_state_converter';

class MockCard extends Card {
  constructor(id: number, type: CardType = CardType.Equipment, profile: CardProfileConfig = {}) {
    super(id, `Mock ${id}`, type, 1, profile);
  }
  getValidTargets(): CardStack[] {
    return [];
  }
  onEnterGame() {}
  onLeaveGame() {}
  onStartTurn() {}
  onEndTurn() {}
}

/**
 * Tactic card playable on the opposing player's colony, used to let the
 * opponent open the tactic card reveal window.
 */
class PlayableTacticCard extends TacticCard {
  constructor(id: number = 9901) {
    super(id, 'Playable Tactic (Test)', 1, TacticDiscipline.Military);
  }
  onEnterGame() {}
  getValidTargets(player: Player): CardStack[] {
    return this.onlyOpponentColonyTarget(player);
  }
}

/**
 * Tactic counter card which keeps a tactic card intervention window open, so
 * the played tactic card stays revealed via highlightCardUUID.
 */
class CounterTacticCard extends TacticCard {
  constructor() {
    super(9902, 'Counter Tactic (Test)', 1, TacticDiscipline.Intelligence);
  }
  onEnterGame(player: Player) {
    this.onEnterGameInterventionTacticCard(player);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.getValidTargetsInterventionTacticCard(player, [TacticDiscipline.Military]);
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.TacticCard;
  }
}

const createSocket = (playerNo: number): Socket =>
  ({
    id: `socket-${playerNo}`,
    join: jest.fn(),
    data: {
      user: { username: `Player ${playerNo}` },
      activeDeck: [0, 1, 2, 3].map(i => new MockCard(100 * playerNo + i))
    }
  }) as unknown as Socket;

const createMatch = (): Match => {
  const match = new Match('test-room', createSocket(0), createSocket(1));
  match.activePlayerNo = 1;
  match.pendingActionPlayerNo = 1;
  match.turnPhase = TurnPhase.Build;
  return match;
};

const addHandCard = (player: Player, card: Card): CardStack => {
  const handCard = new RootCardStack(card, Zone.Hand, player);
  player.hand.push(handCard);
  return handCard;
};

describe('toClientState', () => {
  let match: Match;

  beforeEach(() => {
    match = createMatch();
  });

  describe('hand card redaction', () => {
    test('redacts hand cards of the opponent', () => {
      addHandCard(match.players[1], new MockCard(111));
      addHandCard(match.players[1], new MockCard(112));

      const state = toClientState(match, 0);

      expect(state.opponent.hand).toHaveLength(2);
      state.opponent.hand.forEach(card => {
        expect(card.cardId).toBe(constants.cardBackSideID);
        expect(card.playable).toBe(false);
        expect(card.validTargets).toEqual([]);
        expect(card.optionsToSelect).toBe(0);
        expect(card.options).toEqual([]);
        expect(card.ownedByPlayer).toBe(false);
      });
    });

    test('keeps own hand cards of the requesting player unredacted', () => {
      const ownCard = addHandCard(match.players[0], new MockCard(211));

      const state = toClientState(match, 0);

      expect(state.player.hand).toHaveLength(1);
      expect(state.player.hand[0].uuid).toBe(ownCard.uuid);
      expect(state.player.hand[0].cardId).toBe(211);
      expect(state.player.hand[0].ownedByPlayer).toBe(true);
    });

    test('reveals only the card ID of a hand card revealed via highlightCardUUID', () => {
      const revealedCard = addHandCard(match.players[1], new PlayableTacticCard(113));
      match.highlightCard = revealedCard;

      const state = toClientState(match, 0);

      const revealedHandCard = state.opponent.hand.find(c => c.uuid == revealedCard.uuid);
      expect(revealedHandCard?.cardId).toBe(113);
      // The card is playable for its owner, so the redacted values prove that
      // the reveal exception is limited to the card ID
      expect(revealedCard.hasValidTargets).toBe(true);
      expect(revealedHandCard?.playable).toBe(false);
      expect(revealedHandCard?.validTargets).toEqual([]);
      expect(revealedHandCard?.optionsToSelect).toBe(0);
      expect(revealedHandCard?.options).toEqual([]);
    });
  });

  describe('tactic card reveal', () => {
    test('provides the real card ID of the played tactic card via the state', () => {
      const counterCard = addHandCard(match.players[0], new CounterTacticCard());
      const tacticCard = addHandCard(match.players[1], new PlayableTacticCard(123));

      match.players[1].playHandCard(tacticCard, match.players[0].colonyCardStack);

      // The counter card keeps the intervention window open, so the tactic
      // card is currently revealed to player 0 via highlightCardUUID
      expect(match.intervention).toBeDefined();
      expect(match.highlightCard?.uuid).toBe(tacticCard.uuid);

      const state = toClientState(match, 0);

      expect(state.highlightCardUUID).toBe(tacticCard.uuid);
      expect(state.highlightCardId).toBe(123);
      // The played card left the opponent's hand and no opponent hand card
      // leaks a real card ID
      expect(state.opponent.hand.some(c => c.uuid == tacticCard.uuid)).toBe(false);
      expect(state.opponent.hand.every(c => c.cardId == constants.cardBackSideID)).toBe(true);
      // The own counter card keeps its real data including playability
      const ownCard = state.player.hand.find(c => c.uuid == counterCard.uuid);
      expect(ownCard?.cardId).toBe(9902);
      expect(ownCard?.playable).toBe(true);
      expect(ownCard?.validTargets).toEqual([match.players[1].colonyCardStack.uuid]);
    });
  });
});
