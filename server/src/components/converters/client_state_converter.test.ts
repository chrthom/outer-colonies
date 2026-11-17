import toClientState from './client_state_converter';
import Match from '../game_state/match';
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
      user: { userId: playerNo + 1, username: `Player ${playerNo}` },
      activeDeck: [1, 2, 3, 4].map(i => new MockCard(i, `Deck Card ${i}`, CardType.Hull, 1))
    }
  }) as unknown as Socket;

const createMatch = (): Match => new Match('test-room', createSocket(0), createSocket(1));

/**
 * Creates an orbital ship stack (with one non-retractable equipment card) for player 0 and
 * retracts it, producing one retract and one discard movement event.
 */
const retractShipWithEquipment = (match: Match): { ship: CardStack; equipment: CardStack } => {
  const player = match.players[0];
  const ship = new RootCardStack(new MockCard(1, 'Ship', CardType.Hull, 1), Zone.Orbital, player);
  const equipment = new AttachmentCardStack(new MockCard(2, 'Equipment', CardType.Equipment, 1), ship);
  ship.attach(equipment);
  jest.spyOn(equipment.card, 'canBeRetracted').mockReturnValue(false);
  player.cardStacks.push(ship);
  ship.retract();
  return { ship, equipment };
};

describe('toClientState', () => {
  describe('events', () => {
    test('attaches the movement events with playerEvent = true for the owning player', () => {
      const match = createMatch();
      const { ship, equipment } = retractShipWithEquipment(match);

      const state = toClientState(match, 0);

      expect(state.events).toEqual([
        { type: EventType.Discard, playerEvent: true, oldUUID: equipment.uuid },
        {
          type: EventType.Retract,
          playerEvent: true,
          oldUUID: ship.uuid,
          newUUID: expect.any(String)
        }
      ]);
      // The retracted card reappears as a new hand card referenced by the retract event
      expect(state.player.hand.map(h => h.uuid)).toContain(state.events[1].newUUID);
    });

    test('attaches the same movement events with playerEvent = false for the opponent', () => {
      const match = createMatch();
      const { ship, equipment } = retractShipWithEquipment(match);

      const state = toClientState(match, 1);

      expect(state.events).toEqual([
        { type: EventType.Discard, playerEvent: false, oldUUID: equipment.uuid },
        {
          type: EventType.Retract,
          playerEvent: false,
          oldUUID: ship.uuid,
          newUUID: expect.any(String)
        }
      ]);
    });

    test('contains an empty event list when no cards were moved', () => {
      const match = createMatch();

      const state = toClientState(match, 0);

      expect(state.events).toEqual([]);
    });
  });
});
