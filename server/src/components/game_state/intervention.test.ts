import { Socket } from 'socket.io';
import {
  BattleType,
  CardType,
  InterventionType,
  TacticDiscipline,
  TurnPhase,
  Zone
} from '../../shared/config/enums';
import { rules } from '../../shared/config/rules';
import Card from '../cards/card';
import CardStack, { RootCardStack } from '../cards/card_stack';
import { CardProfileConfig } from '../cards/card_profile';
import { Card509 } from '../cards/collection/tactic_economy_cards';
import { Card231, Card529 } from '../cards/collection/tactic_intelligence_cards';
import TacticCard from '../cards/types/tactic_card';
import { InterventionOpponentRaidStart } from './intervention';
import Match from './match';
import Player from './player';

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
 * Tactic card declaring the new OpponentRaidStart intervention window, modeled
 * after the reactive raid-cost tactic card planned for Ed5. No real card uses
 * this intervention type yet.
 */
class RaidReactionCard extends TacticCard {
  constructor() {
    super(9901, 'Raid Reaction (Test)', 1, TacticDiscipline.Military);
  }
  onEnterGame() {}
  getValidTargets(player: Player): CardStack[] {
    return this.onlyOpponentColonyTarget(player);
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.OpponentRaidStart;
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
  match.activePlayerNo = 0;
  match.pendingActionPlayerNo = 0;
  match.turnPhase = TurnPhase.Build;
  return match;
};

const addOrbitalShip = (player: Player, cardId: number): CardStack => {
  const ship = new RootCardStack(new MockCard(cardId, CardType.Hull, { speed: 2 }), Zone.Orbital, player);
  player.cardStacks.push(ship);
  return ship;
};

const addHandCard = (player: Player, card: Card): CardStack => {
  const handCard = new RootCardStack(card, Zone.Hand, player);
  player.hand.push(handCard);
  return handCard;
};

describe('InterventionOpponentRaidStart', () => {
  let match: Match;

  beforeEach(() => {
    match = createMatch();
  });

  describe('on raid announcement (Match.prepareBuildPhaseReaction)', () => {
    test('auto-skips and leaves turn flow and timing unchanged without eligible card', () => {
      const ship = addOrbitalShip(match.players[0], 1);

      match.prepareBuildPhaseReaction({ type: BattleType.Raid, shipIds: [ship.uuid] });

      expect(match.intervention).toBeUndefined();
      expect(match.turnPhase).toBe(TurnPhase.Build);
      expect(match.pendingActionPlayerNo).toBe(match.inactivePlayerNo);
      expect(match.battle.type).toBe(BattleType.Raid);
    });

    test('opens the window for the defender holding an eligible raid reaction card', () => {
      const ship = addOrbitalShip(match.players[0], 1);
      addHandCard(match.players[1], new RaidReactionCard());

      match.prepareBuildPhaseReaction({ type: BattleType.Raid, shipIds: [ship.uuid] });

      expect(match.intervention).toBeInstanceOf(InterventionOpponentRaidStart);
      expect(match.intervention?.type).toBe(InterventionType.OpponentRaidStart);
      expect(match.pendingActionPlayerNo).toBe(match.inactivePlayerNo);
      expect(match.turnPhase).toBe(TurnPhase.Build);
    });

    test('opens no window when only the attacker holds an eligible card', () => {
      const ship = addOrbitalShip(match.players[0], 1);
      addHandCard(match.players[0], new RaidReactionCard());

      match.prepareBuildPhaseReaction({ type: BattleType.Raid, shipIds: [ship.uuid] });

      expect(match.intervention).toBeUndefined();
      expect(match.pendingActionPlayerNo).toBe(match.inactivePlayerNo);
    });

    test('opens no window on missions', () => {
      const ship = addOrbitalShip(match.players[0], 1);
      addHandCard(match.players[1], new RaidReactionCard());

      match.prepareBuildPhaseReaction({ type: BattleType.Mission, shipIds: [ship.uuid] });

      expect(match.intervention).toBeUndefined();
      expect(match.battle.type).toBe(BattleType.Mission);
      expect(match.pendingActionPlayerNo).toBe(match.inactivePlayerNo);
    });

    test('opens no window when no battle is planned', () => {
      for (let i = 0; i <= rules.maxHandCards; i++) {
        addHandCard(match.players[0], new MockCard(i));
      }

      match.prepareBuildPhaseReaction({ type: BattleType.None, shipIds: [] });

      expect(match.intervention).toBeUndefined();
      expect(match.turnPhase).toBe(TurnPhase.End);
    });
  });

  describe('skip', () => {
    test('continues to the defense fleet nomination flow', () => {
      const ship = addOrbitalShip(match.players[0], 1);
      addHandCard(match.players[1], new RaidReactionCard());
      match.prepareBuildPhaseReaction({ type: BattleType.Raid, shipIds: [ship.uuid] });
      expect(match.intervention).toBeDefined();

      match.skipIntervention();

      expect(match.intervention).toBeUndefined();
      expect(match.turnPhase).toBe(TurnPhase.Build);
      expect(match.pendingActionPlayerNo).toBe(match.inactivePlayerNo);
      expect(match.battle.type).toBe(BattleType.Raid);
      expect(() => match.prepareCombatPhase([])).not.toThrow();
    });
  });

  describe('OpponentTurnStart regression (cards 231 / 509 / 529)', () => {
    test.each([
      ['231 Unruhen schüren', () => new Card231()],
      ['509 Zahn der Zeit', () => new Card509()],
      ['529 Fake-News verbreiten', () => new Card529()]
    ])('%s still opens the turn start window', (_, createCard) => {
      addOrbitalShip(match.players[1], 2);
      addHandCard(match.players[0], createCard());

      match.prepareStartPhase();

      expect(match.activePlayerNo).toBe(1);
      expect(match.intervention).toBeDefined();
      expect(match.intervention?.type).toBe(InterventionType.OpponentTurnStart);
      expect(match.pendingActionPlayerNo).toBe(0);
    });

    test('auto-skips the turn start window without eligible card and continues to build phase', () => {
      match.prepareStartPhase();

      expect(match.intervention).toBeUndefined();
      expect(match.turnPhase).toBe(TurnPhase.Build);
      expect(match.pendingActionPlayerNo).toBe(match.activePlayerNo);
    });
  });
});
