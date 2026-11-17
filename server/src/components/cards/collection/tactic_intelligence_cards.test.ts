import { Socket } from 'socket.io';
import {
  BattleType,
  CardDurability,
  CardType,
  InterventionType,
  TacticDiscipline,
  TurnPhase,
  Zone
} from '../../../shared/config/enums';
import Card from '../card';
import CardStack, { RootCardStack } from '../card_stack';
import { CardProfileConfig } from '../card_profile';
import Battle from '../../game_state/battle';
import Match from '../../game_state/match';
import Player from '../../game_state/player';
import { Card442, Card517 } from './tactic_intelligence_cards';

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

  test('is an Intelligence discipline tactic card', () => {
    expect(card.discipline).toBe(TacticDiscipline.Intelligence);
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

describe('Card442 Triebwerksschaden', () => {
  let match: Match;
  let card: Card442;

  beforeEach(() => {
    match = createMatch();
    card = new Card442();
  });

  test('is an Intelligence discipline tactic card', () => {
    expect(card.discipline).toBe(TacticDiscipline.Intelligence);
    expect(card.type).toBe(CardType.Tactic);
  });

  test('has Turn durability', () => {
    expect(card.durability).toBe(CardDurability.Turn);
  });

  test('is only playable in the battle round start intervention window', () => {
    expect(card.canIntervene(InterventionType.BattleRoundStart)).toBe(true);
    expect(card.canIntervene(InterventionType.BattleRoundEnd)).toBe(false);
    expect(card.canIntervene(InterventionType.TacticCard)).toBe(false);
  });

  describe('getValidTargets', () => {
    test('returns no targets outside a battle', () => {
      expect(card.getValidTargets(match.players[0])).toEqual([]);
    });

    test('returns only opponent ships in the battle with speed >= 1', () => {
      match.battle = new Battle(BattleType.Raid, 0);
      const opponentShip = new RootCardStack(
        new MockCard(101, CardType.Hull, { speed: 2 }),
        Zone.Neutral,
        match.players[1]
      );
      const opponentStation = new RootCardStack(
        new MockCard(102, CardType.Hull, { speed: 0 }),
        Zone.Neutral,
        match.players[1]
      );
      const ownShip = new RootCardStack(
        new MockCard(103, CardType.Hull, { speed: 2 }),
        Zone.Neutral,
        match.players[0]
      );
      match.battle.ships[1] = [opponentShip, opponentStation];
      match.battle.ships[0] = [ownShip];
      match.players[1].cardStacks.push(opponentShip, opponentStation);
      match.players[0].cardStacks.push(ownShip);

      const targets = card.getValidTargets(match.players[0]);

      expect(targets).toEqual([opponentShip]);
    });
  });

  describe('playHandCard', () => {
    test('attaches to the targeted opponent ship and lowers its speed by 1', () => {
      const target = new RootCardStack(
        new MockCard(104, CardType.Hull, { speed: 2 }),
        Zone.Neutral,
        match.players[1]
      );
      const handCard = new RootCardStack(card, Zone.Hand, match.players[0]);

      handCard.playHandCard(target);

      expect(target.attachedCardStacks).toContain(handCard);
      expect(target.profile.speed).toBe(1);
    });

    test('drops the effective speed of a speed 1 ship to 0', () => {
      const target = new RootCardStack(
        new MockCard(105, CardType.Hull, { speed: 1 }),
        Zone.Neutral,
        match.players[1]
      );
      const handCard = new RootCardStack(card, Zone.Hand, match.players[0]);

      handCard.playHandCard(target);

      expect(target.profile.speed).toBe(0);
    });
  });
});
