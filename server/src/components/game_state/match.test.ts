import { Socket } from 'socket.io';
import { CardType, Zone } from '../../shared/config/enums';
import Card from '../cards/card';
import CardStack, { RootCardStack } from '../cards/card_stack';
import { CardProfileConfig } from '../cards/card_profile';
import Match from './match';
import Player from './player';

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

const createMatch = (): Match => new Match('test-room', createSocket(0), createSocket(1));

describe('Match.removeDestroyedCardStacks', () => {
  let match: Match;
  let player: Player;
  let opponent: Player;

  beforeEach(() => {
    match = createMatch();
    player = match.players[0];
    opponent = match.players[1];
  });

  test('pushes destroyed stack cards onto the owning player discard pile', () => {
    const shipCard = new MockCard(1, CardType.Hull, { hp: 3 });
    const ship = new RootCardStack(shipCard, Zone.Orbital, opponent);
    opponent.cardStacks.push(ship);
    ship.damage = 3;

    const destroyedStacks = match.removeDestroyedCardStacks();

    expect(destroyedStacks).toEqual([ship]);
    expect(opponent.discardPile).toContain(shipCard);
    expect(opponent.cardStacks).not.toContain(ship);
  });

  test('routes cards attached to an opponent stack to the playing player discard pile', () => {
    const ship = new RootCardStack(new MockCard(1, CardType.Hull, { hp: 3 }), Zone.Orbital, opponent);
    opponent.cardStacks.push(ship);
    const tacticCard = new MockCard(2, CardType.Tactic);
    const tactic = new RootCardStack(tacticCard, Zone.Hand, player);
    ship.attach(tactic);
    ship.damage = 3;

    match.removeDestroyedCardStacks();

    expect(player.discardPile).toContain(tacticCard);
    expect(opponent.discardPile).not.toContain(tacticCard);
  });
});
