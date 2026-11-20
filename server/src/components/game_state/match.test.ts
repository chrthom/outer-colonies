import { Socket } from 'socket.io';
import Card from '../cards/card';
import CardStack, { AttachmentCardStack, RootCardStack } from '../cards/card_stack';
import { CardProfileConfig } from '../cards/card_profile';
import { BattleType, CardDurability, CardType, EventType, Zone } from '../../shared/config/enums';
import Battle from './battle';
import Match from './match';
import Player from './player';

class MockCard extends Card {
  constructor(id: number, type: CardType, profile: CardProfileConfig = {}) {
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
      user: { userId: playerNo + 1, username: `Player ${playerNo}` },
      activeDeck: [1, 2, 3, 4].map(i => new MockCard(i, CardType.Hull))
    }
  }) as unknown as Socket;

const createMatch = (): Match => new Match('test-room', createSocket(0), createSocket(1));

describe('Match', () => {
  describe('addCardMovementEvent', () => {
    test('records type, owning player and old UUID of the moved card stack', () => {
      const match = createMatch();
      const ship = new RootCardStack(new MockCard(1, CardType.Hull), Zone.Orbital, match.players[0]);

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
      const ship = new RootCardStack(new MockCard(1, CardType.Hull), Zone.Orbital, player);
      const equipment = new AttachmentCardStack(new MockCard(2, CardType.Equipment), ship);
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
      const ship = new RootCardStack(new MockCard(1, CardType.Hull), Zone.Orbital, match.players[0]);
      match.addCardMovementEvent(EventType.Discard, ship);

      match.resetTempStates();

      expect(match.events).toEqual([]);
    });
  });
});

const createShip = (id: number, owner: Player, hp: number): CardStack => {
  const ship = new RootCardStack(new MockCard(id, CardType.Hull, { hp }), Zone.Orbital, owner);
  owner.cardStacks.push(ship);
  return ship;
};

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
    const ship = createShip(1, opponent, 3);
    ship.damage = 3;

    const destroyedStacks = match.removeDestroyedCardStacks();

    expect(destroyedStacks).toEqual([ship]);
    expect(opponent.discardPile).toContain(ship.card);
    expect(opponent.cardStacks).not.toContain(ship);
  });

  test('routes cards attached to an opponent stack to the playing player discard pile', () => {
    const ship = createShip(1, opponent, 3);
    const tacticCard = new MockCard(2, CardType.Tactic);
    const tactic = new RootCardStack(tacticCard, Zone.Hand, player);
    ship.attach(tactic);
    ship.damage = 3;

    match.removeDestroyedCardStacks();

    expect(player.discardPile).toContain(tacticCard);
    expect(opponent.discardPile).not.toContain(tacticCard);
  });

  test('returns an attachment played by the opponent to the playing player', () => {
    const ship = createShip(1, opponent, 4);
    ship.damage = 4;
    const tactic = new RootCardStack(new MockCard(2, CardType.Tactic), Zone.Hand, player);
    ship.attach(tactic); // simulates playHandCard attaching the played tactic card

    const destroyed = match.removeDestroyedCardStacks();

    expect(destroyed).toEqual([ship]);
    expect(opponent.cardStacks).not.toContain(ship);
    expect(opponent.discardPile).toContain(ship.card);
    expect(player.discardPile).toContain(tactic.card);
    expect(opponent.discardPile).not.toContain(tactic.card);
    expect(player.discardPile).not.toContain(ship.card);
  });

  test('routes all cards of a destroyed stack to the stack owner without enemy attachments', () => {
    const ship = createShip(3, opponent, 4);
    const equipment = new RootCardStack(new MockCard(4, CardType.Equipment), Zone.Hand, opponent);
    ship.attach(equipment);
    ship.damage = 4;

    match.removeDestroyedCardStacks();

    expect(opponent.discardPile).toContain(ship.card);
    expect(opponent.discardPile).toContain(equipment.card);
    expect(player.discardPile).toEqual([]);
  });

  test('keeps destroyed colonies on the board', () => {
    // The colony's onDestruction ends the game and persists earnings
    jest.spyOn(match.gameResult, 'persistEarnings').mockResolvedValue(undefined);
    const colony = player.colonyCardStack;
    colony.damage = colony.profile.hp;

    const destroyed = match.removeDestroyedCardStacks();

    expect(destroyed).toEqual([]);
    expect(player.cardStacks).toContain(colony);
  });

  test('removes destroyed stacks from the battle ship lists', () => {
    const destroyedShip = createShip(9, opponent, 4);
    const survivingShip = createShip(10, opponent, 4);
    match.battle = new Battle(BattleType.Raid, 0);
    match.battle.ships[1] = [destroyedShip, survivingShip];
    destroyedShip.damage = 4;

    match.removeDestroyedCardStacks();

    expect(match.battle.ships[1]).toEqual([survivingShip]);
  });
});

describe('Match.prepareStartPhase', () => {
  test('discards an enemy Turn tactic attachment to the caster at the turn start of the ship owner', () => {
    const match = createMatch();
    const caster = match.players[0];
    const shipOwner = match.players[1];
    const ship = createShip(5, shipOwner, 4);
    const tactic = new RootCardStack(new MockCard(6, CardType.Tactic), Zone.Hand, caster);
    jest.spyOn(tactic.card, 'durability', 'get').mockReturnValue(CardDurability.Turn);
    ship.attach(tactic); // simulates playHandCard attaching the played tactic card
    shipOwner.deck = [new MockCard(7, CardType.Equipment), new MockCard(8, CardType.Equipment)];
    match.activePlayerNo = caster.no; // prepareStartPhase flips to the ship owner

    match.prepareStartPhase();

    expect(ship.attachedCardStacks).not.toContain(tactic);
    expect(caster.discardPile).toContain(tactic.card);
    expect(shipOwner.discardPile).not.toContain(tactic.card);
    expect(shipOwner.cardStacks).toContain(ship);
  });
});
