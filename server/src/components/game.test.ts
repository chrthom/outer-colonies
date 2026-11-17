import { Server, Socket } from 'socket.io';
import { gameSocketListeners } from './game';
import Battle from './game_state/battle';
import Match from './game_state/match';
import Player from './game_state/player';
import { InterventionAttack } from './game_state/intervention';
import CardStack, { AttachmentCardStack, RootCardStack } from './cards/card_stack';
import { CardProfileConfig } from './cards/card_profile';
import EquipmentCard from './cards/types/equipment_card';
import HullCard, { toHullMultipart } from './cards/types/hull_card';
import TacticCard from './cards/types/tactic_card';
import { ClientState } from '../shared/interfaces/client_state';
import {
  BattleType,
  InterventionType,
  MsgTypeInbound,
  MsgTypeOutbound,
  TacticDiscipline,
  TurnPhase,
  Zone
} from '../shared/config/enums';

class MockHullCard extends HullCard {
  constructor(id: number, profile: CardProfileConfig = {}) {
    super(id, `Hull ${id}`, 1, toHullMultipart(1, false, id), profile);
  }
}

class MockWeaponCard extends EquipmentCard {
  constructor(id: number, damage: number) {
    super(id, `Weapon ${id}`, 1, {}, { range: 1, damage, pointDefense: 0, shield: 0, armour: 0 });
  }
}

/**
 * Tactic card which can only be played as attack intervention once the attacked
 * target has taken damage. It therefore becomes playable mid-way through an
 * attack with all weapons, exactly when the first weapon has dealt damage.
 */
class DamagedTargetReactionCard extends TacticCard {
  constructor() {
    super(9902, 'Damaged Target Reaction (Test)', 1, TacticDiscipline.Military);
  }
  onEnterGame(player: Player, target: CardStack) {
    this.onEnterGameAttackIntervention(player, target);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.getValidTargetsInterventionAttack(player, i => i.target.damage > 0);
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.Attack;
  }
}

interface SocketMock {
  socket: Socket;
  on: jest.Mock;
  emit: jest.Mock;
}

const createSocketMock = (playerNo: number): SocketMock => {
  const on = jest.fn();
  const emit = jest.fn();
  const socket = {
    id: `socket-${playerNo}`,
    join: jest.fn(),
    on,
    emit,
    data: { user: { username: `Player ${playerNo}` }, activeDeck: [] }
  };
  return { socket: socket as unknown as Socket, on, emit };
};

const createIoMock = (sockets: Socket[]): Server =>
  ({
    sockets: { sockets: { get: (id: string) => sockets.find(s => s.id == id) } }
  }) as unknown as Server;

const createCombatMatch = (): { match: Match; socketMocks: [SocketMock, SocketMock] } => {
  const socketMocks: [SocketMock, SocketMock] = [createSocketMock(0), createSocketMock(1)];
  const match = new Match('test-room', socketMocks[0].socket, socketMocks[1].socket);
  match.activePlayerNo = 0;
  match.pendingActionPlayerNo = 0;
  match.turnPhase = TurnPhase.Combat;
  match.battle = new Battle(BattleType.Raid, 0);
  match.battle.range = 1;
  return { match, socketMocks };
};

const createAttackerShip = (player: Player, weaponDamages: number[]): CardStack[] => {
  const ship = new RootCardStack(new MockHullCard(1), Zone.Neutral, player);
  const weapons = weaponDamages.map(
    (damage, i) => new AttachmentCardStack(new MockWeaponCard(100 + i, damage), ship)
  );
  weapons.forEach(weapon => ship.attach(weapon));
  player.cardStacks.push(ship);
  return weapons;
};

const createDefenderShip = (player: Player): CardStack => {
  const ship = new RootCardStack(new MockHullCard(2), Zone.Orbital, player);
  player.cardStacks.push(ship);
  return ship;
};

const getAttackHandler = (io: Server, socketMock: SocketMock): ((...args: unknown[]) => void) => {
  gameSocketListeners(io, socketMock.socket);
  const registration = socketMock.on.mock.calls.find(([event]) => event == MsgTypeInbound.Attack);
  if (!registration) throw new Error('Attack handler was not registered');
  return registration[1];
};

const getEmittedState = (socketMock: SocketMock): ClientState => {
  const emission = socketMock.emit.mock.calls.find(([event]) => event == MsgTypeOutbound.State);
  if (!emission) throw new Error('No state was emitted');
  return emission[1];
};

describe('MsgTypeInbound.Attack with all weapons', () => {
  let match: Match;
  let socketMocks: [SocketMock, SocketMock];
  let weapons: CardStack[];
  let defenderShip: CardStack;
  let attackWithAllWeapons: (...args: unknown[]) => void;

  const setupBattle = (weaponDamages: number[]): void => {
    ({ match, socketMocks } = createCombatMatch());
    weapons = createAttackerShip(match.players[0], weaponDamages);
    defenderShip = createDefenderShip(match.players[1]);
    match.battle.ships[0] = [weapons[0].rootCardStack];
    match.battle.ships[1] = [defenderShip];
    match.reactivateAllCardStacks();
    attackWithAllWeapons = getAttackHandler(createIoMock(socketMocks.map(sm => sm.socket)), socketMocks[0]);
  };

  test('accumulates the attack results of all weapons against a single target', () => {
    setupBattle([3, 4]);

    attackWithAllWeapons('*', '*', defenderShip.uuid);

    const state = getEmittedState(socketMocks[0]);
    expect(state.battle.recentAttack).toEqual({
      sourceRootUUID: weapons[0].rootCardStack.uuid,
      sourceSubUUID: weapons[0].uuid,
      targetUUID: defenderShip.uuid,
      pointDefense: 0,
      shield: 0,
      armour: 0,
      damage: 7
    });
    expect(defenderShip.damage).toBe(7);
    expect(weapons.map(w => w.attackAvailable)).toEqual([false, false]);
    expect(match.intervention).toBeUndefined();
  });

  test('reports only the attacks performed before a pending intervention without double-counting', () => {
    setupBattle([3, 4]);
    const defender = match.players[1];
    defender.hand.push(new RootCardStack(new DamagedTargetReactionCard(), Zone.Hand, defender));

    attackWithAllWeapons('*', '*', defenderShip.uuid);

    // The first weapon attacked before the defender's reaction card became
    // playable, the second weapon's attack is deferred by the intervention
    const state = getEmittedState(socketMocks[0]);
    expect(state.battle.recentAttack).toEqual({
      sourceRootUUID: weapons[0].rootCardStack.uuid,
      sourceSubUUID: weapons[0].uuid,
      targetUUID: defenderShip.uuid,
      pointDefense: 0,
      shield: 0,
      armour: 0,
      damage: 3
    });
    expect(defenderShip.damage).toBe(3);
    expect(weapons.map(w => w.attackAvailable)).toEqual([false, true]);
    expect(match.intervention).toBeInstanceOf(InterventionAttack);
    expect((<InterventionAttack>match.intervention).src).toBe(weapons[1]);
    expect(state.intervention?.attack?.sourceSubUUID).toBe(weapons[1].uuid);
    expect(match.pendingActionPlayerNo).toBe(1);
  });
});
