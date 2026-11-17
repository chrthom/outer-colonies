import { Socket } from 'socket.io';
import {
  CardDurability,
  CardType,
  GameResultType,
  TacticDiscipline,
  TurnPhase,
  Zone
} from '../../../shared/config/enums';
import Card from '../card';
import CardStack, { RootCardStack } from '../card_stack';
import { CardProfileConfig } from '../card_profile';
import Match from '../../game_state/match';
import Player from '../../game_state/player';
import { Card437 } from './tactic_economy_cards';

class MockCard extends Card {
  constructor(id: number, type: CardType = CardType.Hull, profile: CardProfileConfig = {}) {
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
      user: { userId: playerNo, username: `Player ${playerNo}` },
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

describe('Card437 Kopfgeld', () => {
  let match: Match;
  let player: Player;
  let opponent: Player;
  let card: Card437;
  let opponentShip: CardStack;

  beforeEach(() => {
    match = createMatch();
    player = match.players[0];
    opponent = match.players[1];
    card = new Card437();
    player.deck = [1, 2, 3, 4, 5, 6].map(i => new MockCard(200 + i));
    opponentShip = new RootCardStack(new MockCard(1, CardType.Hull, { hp: 3 }), Zone.Orbital, opponent);
    opponent.cardStacks.push(opponentShip);
  });

  test('is a permanent Trade discipline tactic card', () => {
    expect(card.type).toBe(CardType.Tactic);
    expect(card.discipline).toBe(TacticDiscipline.Trade);
    expect(card.durability).toBe(CardDurability.Permanent);
  });

  test('targets only opponent hull card stacks, including stations', () => {
    const ownShip = new RootCardStack(new MockCard(2, CardType.Hull), Zone.Orbital, player);
    const opponentStation = new RootCardStack(new MockCard(3, CardType.Hull), Zone.Colony, opponent);
    player.cardStacks.push(ownShip);
    opponent.cardStacks.push(opponentStation);

    expect(card.getValidTargets(player)).toEqual([opponentShip, opponentStation]);
  });

  describe('played on an opponent ship', () => {
    let kopfgeldStack: CardStack;

    beforeEach(() => {
      kopfgeldStack = new RootCardStack(card, Zone.Hand, player);
      player.hand.push(kopfgeldStack);
      player.playHandCard(kopfgeldStack, opponentShip);
    });

    test('attaches to the targeted ship and stays owned by the playing player', () => {
      expect(opponentShip.attachedCardStacks).toContain(kopfgeldStack);
      expect(kopfgeldStack.owner).toBe(player);
    });

    test('draws 4 cards for the playing player when the ship is destroyed', () => {
      opponentShip.damage = 3;
      const handSizeBefore = player.hand.length;

      match.removeDestroyedCardStacks();

      expect(player.hand).toHaveLength(handSizeBefore + 4);
      expect(player.deck).toHaveLength(2);
    });

    test('keeps the destruction result when the bounty draw depletes the deck in the same battle as the colony destruction', () => {
      jest.spyOn(match.gameResult, 'persistEarnings').mockResolvedValue(undefined);
      player.deck = [new MockCard(301), new MockCard(302)];
      const colony = opponent.colonyCardStack;
      colony.damage = colony.profile.hp;
      opponentShip.damage = 3;
      const handSizeBefore = player.hand.length;

      match.removeDestroyedCardStacks();

      expect(match.gameResult.gameOver).toBe(true);
      expect(match.gameResult.type).toBe(GameResultType.Destruction);
      expect(match.gameResult.winnerNo).toBe(player.no);
      expect(match.gameResult.persistEarnings).toHaveBeenCalledTimes(2);
      expect(player.hand).toHaveLength(handSizeBefore + 2); // partial bounty from the depleted deck
      expect(player.deck).toHaveLength(0);
    });

    test('returns to the playing player discard pile when the ship is destroyed', () => {
      opponentShip.damage = 3;

      match.removeDestroyedCardStacks();

      expect(player.discardPile).toContain(card);
      expect(opponent.discardPile).not.toContain(card);
      expect(opponent.discardPile).toContain(opponentShip.card);
    });

    test('is discarded to the playing player pile without bounty when the ship is retracted', () => {
      opponentShip.retract();

      expect(player.discardPile).toContain(card);
      expect(opponent.discardPile).not.toContain(card);
      expect(opponent.hand.map(cs => cs.card)).toContain(opponentShip.card);
      expect(player.hand).toHaveLength(0);
    });
  });
});
