import { Socket } from 'socket.io';
import { CardType, TacticDiscipline, TurnPhase } from '../../../shared/config/enums';
import Card from '../card';
import CardStack from '../card_stack';
import { CardProfileConfig } from '../card_profile';
import Match from '../../game_state/match';
import Player from '../../game_state/player';
import { Card517 } from './tactic_economy_cards';

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
  match.activePlayerNo = 0;
  match.pendingActionPlayerNo = 0;
  match.turnPhase = TurnPhase.Build;
  return match;
};

describe('Card517 Diasporabewegung', () => {
  let match: Match;
  let player: Player;
  let card: Card517;

  beforeEach(() => {
    match = createMatch();
    player = match.players[0];
    card = new Card517();
  });

  test('is a Trade discipline tactic card', () => {
    expect(card.discipline).toBe(TacticDiscipline.Trade);
  });

  describe('onEnterGame', () => {
    test('puts the searched orb card on top of the deck', () => {
      const orbCard = new MockCard(9001, CardType.Orb);
      player.deck = [
        new MockCard(1),
        new MockCard(2),
        orbCard,
        new MockCard(3),
        new MockCard(4),
        new MockCard(5),
        new MockCard(6),
        new MockCard(7),
        new MockCard(8)
      ];

      card.onEnterGame(player, player.colonyCardStack, player.colonyCardStack, [orbCard.id]);

      expect(player.deck[0]).toBe(orbCard);
    });

    test('keeps all deck cards in the deck', () => {
      const orbCard = new MockCard(9001, CardType.Orb);
      const deckCards = [
        new MockCard(1),
        new MockCard(2),
        orbCard,
        new MockCard(3),
        new MockCard(4),
        new MockCard(5)
      ];
      player.deck = [...deckCards];

      card.onEnterGame(player, player.colonyCardStack, player.colonyCardStack, [orbCard.id]);

      expect(player.deck).toHaveLength(deckCards.length);
      deckCards.forEach(c => expect(player.deck).toContain(c));
    });
  });

  describe('getValidTargets', () => {
    test('returns only the colony card stack if the deck contains an orb card', () => {
      player.deck = [new MockCard(1), new MockCard(9001, CardType.Orb)];

      const targets = card.getValidTargets(player);

      expect(targets).toEqual([player.colonyCardStack]);
    });

    test('returns no targets if the deck contains no orb card', () => {
      player.deck = [new MockCard(1), new MockCard(2)];

      expect(card.getValidTargets(player)).toEqual([]);
    });
  });

  describe('onEnterGameSelectableCardOptions', () => {
    test('offers only the orb cards of the deck', () => {
      const orbCard1 = new MockCard(9001, CardType.Orb);
      const orbCard2 = new MockCard(9002, CardType.Orb);
      player.deck = [new MockCard(1), orbCard1, new MockCard(2), orbCard2];

      expect(card.onEnterGameSelectableCardOptions(player)).toEqual([orbCard1.id, orbCard2.id]);
      expect(card.onEnterGameNumberOfSelectableCardOptions()).toBe(1);
    });
  });
});
