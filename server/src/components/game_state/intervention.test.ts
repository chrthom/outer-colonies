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
import { Card346 } from '../cards/collection/tactic_military_cards';
import TacticCard from '../cards/types/tactic_card';
import {
  InterventionAttack,
  InterventionBattleRoundEnd,
  InterventionOpponentRaidStart,
  InterventionTacticCard
} from './intervention';
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

  describe('defender timeout (Player.handleAutomaticReady)', () => {
    test('explicitly closes the raid start window and nominates an empty defense fleet', () => {
      const ship = addOrbitalShip(match.players[0], 1);
      addHandCard(match.players[1], new RaidReactionCard());
      match.prepareBuildPhaseReaction({ type: BattleType.Raid, shipIds: [ship.uuid] });
      expect(match.intervention).toBeInstanceOf(InterventionOpponentRaidStart);

      const prepareCombatPhase = jest.spyOn(match, 'prepareCombatPhase').mockImplementation(() => undefined);

      match.inactivePlayer.handleAutomaticReady();

      // Inaction forfeits the nomination: the window is removed explicitly
      // (not silently discarded) and the defense fleet is nominated empty
      expect(prepareCombatPhase).toHaveBeenCalledTimes(1);
      expect(prepareCombatPhase).toHaveBeenCalledWith([]);
      expect(match.intervention).toBeUndefined();
    });

    test('resolves the raid without the defender acting and continues the match', () => {
      const ship = addOrbitalShip(match.players[0], 1);
      const reactionCard = addHandCard(match.players[1], new RaidReactionCard());
      match.prepareBuildPhaseReaction({ type: BattleType.Raid, shipIds: [ship.uuid] });
      expect(match.intervention).toBeInstanceOf(InterventionOpponentRaidStart);

      const defender = match.inactivePlayer;
      defender.handleAutomaticReady();

      // No stuck state: the raid resolves with the forfeited (empty) defense
      // fleet and the match continues into the defender's next turn
      expect(match.intervention).toBeUndefined();
      expect(match.battle.type).toBe(BattleType.None);
      expect(match.turnPhase).toBe(TurnPhase.Build);
      expect(match.activePlayerNo).toBe(1);
      // The defender never got to play their raid reaction card
      expect(match.players[1].hand).toContain(reactionCard);
    });
  });

  describe('attacker timeout during counter window (Player.handleAutomaticReady)', () => {
    test('resolves the raid reaction and proceeds to the defense fleet nomination', () => {
      const ship = addOrbitalShip(match.players[0], 1);
      const reactionCard = addHandCard(match.players[1], new RaidReactionCard());
      const counterCard = addHandCard(match.players[0], new Card346());
      match.prepareBuildPhaseReaction({ type: BattleType.Raid, shipIds: [ship.uuid] });
      expect(match.intervention).toBeInstanceOf(InterventionOpponentRaidStart);

      // The defender plays the raid reaction card, opening the tactic card
      // counter window with the attacker pending (attacker holds Card346)
      match.inactivePlayer.playHandCard(reactionCard, match.activePlayer.colonyCardStack);
      expect(match.intervention).toBeInstanceOf(InterventionTacticCard);
      expect(match.intervention?.type).toBe(InterventionType.TacticCard);
      expect(match.pendingActionPlayerNo).toBe(match.activePlayerNo);

      match.activePlayer.handleAutomaticReady();

      // The timeout resolves the reaction instead of discarding the raid:
      // the reaction card executed and reached the discard pile (not
      // stranded), the counter window and the auto-skipped raid start
      // window are gone, and the match stays in the build phase with the
      // defender pending for the defense fleet nomination
      expect(match.intervention).toBeUndefined();
      expect(match.turnPhase).toBe(TurnPhase.Build);
      expect(match.battle.type).toBe(BattleType.Raid);
      expect(match.pendingActionPlayerNo).toBe(match.inactivePlayerNo);
      expect(match.players[1].discardPile).toContain(reactionCard.card);
      // The attacker never got to play their counter card
      expect(match.players[0].hand).toContain(counterCard);
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

const createMockMatch = (): Match => ({ intervention: undefined }) as unknown as Match;
const createTacticCard = (match: Match): InterventionTacticCard =>
  new InterventionTacticCard(match, {} as CardStack, {} as CardStack);

describe('Intervention', () => {
  describe('root', () => {
    test('should be the intervention itself when it is not nested', () => {
      const match = createMockMatch();
      const intervention = new InterventionAttack(match, {} as CardStack, {} as CardStack);

      expect(intervention.root).toBe(intervention);
    });

    test('should be the parent intervention of a nested tactic card', () => {
      const match = createMockMatch();
      const roundEnd = new InterventionBattleRoundEnd(match);
      match.intervention = roundEnd;
      const tacticCard = createTacticCard(match);

      expect(tacticCard.root).toBe(roundEnd);
    });

    test('should be the root of a chain of nested tactic cards', () => {
      const match = createMockMatch();
      const roundEnd = new InterventionBattleRoundEnd(match);
      match.intervention = roundEnd;
      const tacticCard = createTacticCard(match);
      match.intervention = tacticCard;
      const counterTacticCard = createTacticCard(match);

      expect(counterTacticCard.root).toBe(roundEnd);
    });

    test('should be a tactic card itself when played without a parent intervention', () => {
      const match = createMockMatch();
      const tacticCard = createTacticCard(match);

      expect(tacticCard.root).toBe(tacticCard);
    });
  });
});
