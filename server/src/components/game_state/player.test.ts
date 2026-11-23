import Match from './match';
import CardStack, { RootCardStack } from '../cards/card_stack';
import Card from '../cards/card';
import { CardType, EventType, Zone } from '../../shared/config/enums';
import { Socket } from 'socket.io';

class MockCard extends Card {
  getValidTargets(): CardStack[] {
    return [];
  }
  onEnterGame(): void {}
  onLeaveGame(): void {}
  onStartTurn(): void {}
  onEndTurn(): void {}
}

const createSocket = (playerNo: number): Socket =>
  ({
    id: `socket-${playerNo}`,
    join: jest.fn(),
    data: {
      user: { userId: playerNo + 1, username: `Player ${playerNo}` },
      activeDeck: [1, 2, 3, 4].map(i => new MockCard(i, `Deck Card ${i}`, CardType.Hull, 1))
    }
  }) as unknown as Socket;

const createMatch = (): Match => new Match('test-room', createSocket(0), createSocket(1));

describe('Player', () => {
  describe('takeCards', () => {
    test('returns the newly created hand card stacks with fresh UUIDs', () => {
      const match = createMatch();
      const player = match.players[0];
      const card1 = new MockCard(1, 'Card 1', CardType.Hull, 1);
      const card2 = new MockCard(2, 'Card 2', CardType.Hull, 1);

      const newHandCardStacks = player.takeCards([card1, card2]);

      expect(player.hand).toEqual(newHandCardStacks);
      expect(newHandCardStacks).toHaveLength(2);
      newHandCardStacks.forEach(cs => {
        expect(cs.zone).toBe(Zone.Hand);
        expect(player.hand).toContain(cs);
      });
    });
  });

  describe('discardHandCards', () => {
    test('discards the hand cards and records a discard movement event per card', () => {
      const match = createMatch();
      const player = match.players[0];
      const handCardStacks = player.takeCards([new MockCard(1, 'Hand Card', CardType.Hull, 1)]);

      player.discardHandCards(handCardStacks[0].uuid);

      expect(player.hand).toEqual([]);
      expect(player.discardPile).toEqual([handCardStacks[0].card]);
      expect(match.events).toEqual([
        { type: EventType.Discard, playerNo: 0, oldUUID: handCardStacks[0].uuid }
      ]);
    });

    test('records no event for unknown hand card UUIDs', () => {
      const match = createMatch();
      const player = match.players[0];

      player.discardHandCards('unknown-uuid');

      expect(player.discardPile).toEqual([]);
      expect(match.events).toEqual([]);
    });
  });

  describe('discardCardStacks', () => {
    test('discards the stack, invokes onLeaveGame and routes opponent attachments to their owner', () => {
      const match = createMatch();
      const player = match.players[0];
      const opponent = match.players[1];
      const shipCard = new MockCard(10, 'Ship', CardType.Hull, 1);
      const tacticCard = new MockCard(11, 'Tactic', CardType.Tactic, 1);
      const leaveSpy = jest.spyOn(shipCard, 'onLeaveGame');
      const ship = new RootCardStack(shipCard, Zone.Orbital, player);
      const tactic = new RootCardStack(tacticCard, Zone.Hand, opponent);
      ship.attach(tactic);
      player.cardStacks.push(ship);

      player.discardCardStacks(ship.uuid, 'unknown-uuid');

      expect(player.cardStacks).not.toContain(ship);
      expect(leaveSpy).toHaveBeenCalledWith(player);
      expect(player.discardPile).toEqual([shipCard]);
      expect(opponent.discardPile).toEqual([tacticCard]);
      expect(match.events).toEqual([
        { type: EventType.Discard, playerNo: 1, oldUUID: tactic.uuid },
        { type: EventType.Discard, playerNo: 0, oldUUID: ship.uuid }
      ]);
    });
  });
});
