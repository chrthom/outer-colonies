import Match from './match';
import CardStack, { AttachmentCardStack, RootCardStack } from '../cards/card_stack';
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
      user: { username: `Player ${playerNo}` },
      activeDeck: [1, 2, 3, 4].map(i => new MockCard(i, `Deck Card ${i}`, CardType.Hull, 1))
    }
  }) as unknown as Socket;

const createMatch = (): Match => new Match('test-room', createSocket(0), createSocket(1));

describe('Match', () => {
  describe('addCardMovementEvent', () => {
    test('records type, owning player and old UUID of the moved card stack', () => {
      const match = createMatch();
      const ship = new RootCardStack(
        new MockCard(1, 'Ship', CardType.Hull, 1),
        Zone.Orbital,
        match.players[0]
      );

      match.addCardMovementEvent(EventType.Retract, ship, 'new-hand-card-uuid');

      expect(match.events).toEqual([
        {
          type: EventType.Retract,
          playerNo: 0,
          oldUUID: ship.uuid,
          newUUID: 'new-hand-card-uuid'
        }
      ]);
    });
  });

  describe('removeDestroyedCardStacks', () => {
    test('records a discard movement event for every card of destroyed stacks', () => {
      const match = createMatch();
      const player = match.players[0];
      const ship = new RootCardStack(new MockCard(1, 'Ship', CardType.Hull, 1), Zone.Orbital, player);
      const equipment = new AttachmentCardStack(new MockCard(2, 'Equipment', CardType.Equipment, 1), ship);
      ship.attach(equipment);
      player.cardStacks.push(ship);
      ship.damage = 1; // Card hp defaults to 0, so the ship is destroyed

      const destroyedCardStacks = match.removeDestroyedCardStacks();

      expect(destroyedCardStacks).toContain(ship);
      expect(player.discardPile).toEqual([...ship.cards]);
      expect(match.events).toEqual([
        { type: EventType.Discard, playerNo: 0, oldUUID: equipment.uuid },
        { type: EventType.Discard, playerNo: 0, oldUUID: ship.uuid }
      ]);
    });

    test('records no events when no card stacks are destroyed', () => {
      const match = createMatch();

      match.removeDestroyedCardStacks();

      expect(match.events).toEqual([]);
    });
  });

  describe('resetTempStates', () => {
    test('clears the accumulated movement events', () => {
      const match = createMatch();
      const ship = new RootCardStack(
        new MockCard(1, 'Ship', CardType.Hull, 1),
        Zone.Orbital,
        match.players[0]
      );
      match.addCardMovementEvent(EventType.Discard, ship);

      match.resetTempStates();

      expect(match.events).toEqual([]);
    });
  });
});
