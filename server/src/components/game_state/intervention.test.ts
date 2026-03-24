import Intervention, { InterventionAttack, InterventionBattleRoundStart, InterventionBattleRoundEnd, InterventionOpponentTurnStart, InterventionTacticCard } from './intervention';
import Player from './player';
import Match from './match';
import Card from '../cards/card';
import CardStack from '../cards/card_stack';
import { RootCardStack } from '../cards/card_stack';
import { CardType, Zone, InterventionType, CardDurability } from '../../shared/config/enums';

// Mock classes for testing
class MockCard extends Card {
  getValidTargets(player: Player): CardStack[] {
    return [];
  }
  
  onEnterGame(player: Player, cardStack: CardStack): void {}
  onLeaveGame(player: Player): void {}
  onStartTurn(player: Player, cardStack: CardStack): void {}
  onEndTurn(player: Player, source: CardStack): void {}
}

class MockPlayer extends Player {
  constructor() {
    super('test-socket', 'Test Player', {} as any, 1, []);
  }
}

class MockMatch {
  room = 'test-room';
  players: Player[] = [];
  battle = {
    recentAttack: undefined,
    range: 1
  };
  activePlayerNo = 1;
  inactivePlayerNo = 2;
  pendingActionPlayerNo = 1;
  turnPhase = 'test';
  countdown = 0;
  gameResult: any = null;
  activePlayer: any = null;
  inactivePlayer: any = null;
  pendingActionPlayer: any = null;
  intervention: any = null;
  highlightCard: any = null;
  
  constructor() {
    // Simple mock that doesn't extend Match
  }
  
  switchPendingPlayer() {}
  prepareBuildPhase() {}
  checkToNextPhase() {}
}

describe('Intervention', () => {
  let match: MockMatch;
  let player: MockPlayer;

  beforeEach(() => {
    player = new MockPlayer();
    match = new MockMatch() as any;
  });

  describe('InterventionAttack', () => {
    test('should create attack intervention with source and target', () => {
      const srcCard = new MockCard(1, 'Source', CardType.Hull, 1);
      const targetCard = new MockCard(2, 'Target', CardType.Hull, 1);
      const srcStack = new RootCardStack(srcCard, Zone.Hand, player);
      const targetStack = new RootCardStack(targetCard, Zone.Hand, player);
      
      const attackIntervention = new InterventionAttack(match as any, srcStack, targetStack);
      
      expect(attackIntervention).toBeDefined();
      expect(attackIntervention.match).toBe(match);
      expect(attackIntervention.type).toBe(InterventionType.Attack);
      expect(attackIntervention.src).toBe(srcStack);
      expect(attackIntervention.target).toBe(targetStack);
    });

    test('should have attack intervention type', () => {
      const srcCard = new MockCard(1, 'Source', CardType.Hull, 1);
      const targetCard = new MockCard(2, 'Target', CardType.Hull, 1);
      const srcStack = new RootCardStack(srcCard, Zone.Hand, player);
      const targetStack = new RootCardStack(targetCard, Zone.Hand, player);
      
      const attackIntervention = new InterventionAttack(match as any, srcStack, targetStack);
      
      expect(attackIntervention.type).toBe(InterventionType.Attack);
    });
  });

  describe('InterventionBattleRoundStart', () => {
    test('should create battle round start intervention', () => {
      const roundStartIntervention = new InterventionBattleRoundStart(match as any);
      
      expect(roundStartIntervention).toBeDefined();
      expect(roundStartIntervention.match).toBe(match);
      expect(roundStartIntervention.type).toBe(InterventionType.BattleRoundStart);
    });

    test('should have battle round start intervention type', () => {
      const roundStartIntervention = new InterventionBattleRoundStart(match as any);
      
      expect(roundStartIntervention.type).toBe(InterventionType.BattleRoundStart);
    });
  });

  describe('InterventionBattleRoundEnd', () => {
    test('should create battle round end intervention', () => {
      const roundEndIntervention = new InterventionBattleRoundEnd(match as any);
      
      expect(roundEndIntervention).toBeDefined();
      expect(roundEndIntervention.match).toBe(match);
      expect(roundEndIntervention.type).toBe(InterventionType.BattleRoundEnd);
    });

    test('should have battle round end intervention type', () => {
      const roundEndIntervention = new InterventionBattleRoundEnd(match as any);
      
      expect(roundEndIntervention.type).toBe(InterventionType.BattleRoundEnd);
    });
  });

  describe('InterventionOpponentTurnStart', () => {
    test('should create opponent turn start intervention', () => {
      const turnStartIntervention = new InterventionOpponentTurnStart(match as any);
      
      expect(turnStartIntervention).toBeDefined();
      expect(turnStartIntervention.match).toBe(match);
      expect(turnStartIntervention.type).toBe(InterventionType.OpponentTurnStart);
    });

    test('should have opponent turn start intervention type', () => {
      const turnStartIntervention = new InterventionOpponentTurnStart(match as any);
      
      expect(turnStartIntervention.type).toBe(InterventionType.OpponentTurnStart);
    });
  });

  describe('InterventionTacticCard', () => {
    test('should create tactic card intervention with source and target', () => {
      const srcCard = new MockCard(1, 'Source', CardType.Tactic, 1);
      const targetCard = new MockCard(2, 'Target', CardType.Hull, 1);
      const srcStack = new RootCardStack(srcCard, Zone.Hand, player);
      const targetStack = new RootCardStack(targetCard, Zone.Hand, player);
      
      const tacticIntervention = new InterventionTacticCard(match as any, srcStack, targetStack);
      
      expect(tacticIntervention).toBeDefined();
      expect(tacticIntervention.match).toBe(match);
      expect(tacticIntervention.type).toBe(InterventionType.TacticCard);
      expect(tacticIntervention.src).toBe(srcStack);
      expect(tacticIntervention.target).toBe(targetStack);
    });

    test('should support optional parameters', () => {
      const srcCard = new MockCard(1, 'Source', CardType.Tactic, 1);
      const targetCard = new MockCard(2, 'Target', CardType.Hull, 1);
      const srcStack = new RootCardStack(srcCard, Zone.Hand, player);
      const targetStack = new RootCardStack(targetCard, Zone.Hand, player);
      const optionalParams = [1, 2, 3];
      
      const tacticIntervention = new InterventionTacticCard(match as any, srcStack, targetStack, optionalParams);
      
      expect(tacticIntervention.optionalParameters).toBe(optionalParams);
    });

    test('should have tactic card intervention type', () => {
      const srcCard = new MockCard(1, 'Source', CardType.Tactic, 1);
      const targetCard = new MockCard(2, 'Target', CardType.Hull, 1);
      const srcStack = new RootCardStack(srcCard, Zone.Hand, player);
      const targetStack = new RootCardStack(targetCard, Zone.Hand, player);
      
      const tacticIntervention = new InterventionTacticCard(match as any, srcStack, targetStack);
      
      expect(tacticIntervention.type).toBe(InterventionType.TacticCard);
    });
  });

  describe('Intervention Common Properties', () => {
    test('should have match reference', () => {
      const intervention = new InterventionBattleRoundStart(match as any);
      expect(intervention.match).toBe(match);
    });

    test('should have intervention type', () => {
      const intervention = new InterventionBattleRoundStart(match as any);
      expect(intervention.type).toBeDefined();
      expect(intervention.type).toBe(InterventionType.BattleRoundStart);
    });

    test('should maintain match reference across interventions', () => {
      const attackIntervention = new InterventionAttack(
        match as any,
        new RootCardStack(new MockCard(1, 'Src', CardType.Hull, 1), Zone.Hand, player),
        new RootCardStack(new MockCard(2, 'Tgt', CardType.Hull, 1), Zone.Hand, player)
      );
      
      const roundStartIntervention = new InterventionBattleRoundStart(match as any);
      
      expect(attackIntervention.match).toBe(roundStartIntervention.match);
    });
  });

  describe('Intervention Type Coverage', () => {
    test('should cover all intervention types', () => {
      const types = [
        InterventionType.Attack,
        InterventionType.BattleRoundEnd,
        InterventionType.BattleRoundStart,
        InterventionType.OpponentTurnStart,
        InterventionType.TacticCard
      ];
      
      // Create appropriate intervention for each type
      const interventions = [
        new InterventionAttack(
          match as any,
          new RootCardStack(new MockCard(1, 'Src', CardType.Hull, 1), Zone.Hand, player),
          new RootCardStack(new MockCard(2, 'Tgt', CardType.Hull, 1), Zone.Hand, player)
        ),
        new InterventionBattleRoundEnd(match as any),
        new InterventionBattleRoundStart(match as any),
        new InterventionOpponentTurnStart(match as any),
        new InterventionTacticCard(
          match as any,
          new RootCardStack(new MockCard(3, 'Src', CardType.Tactic, 1), Zone.Hand, player),
          new RootCardStack(new MockCard(4, 'Tgt', CardType.Hull, 1), Zone.Hand, player)
        )
      ];
      
      interventions.forEach((intervention, index) => {
        expect(intervention.type).toBe(types[index]);
      });
    });
  });

  describe('Intervention Source/Target Relationships', () => {
    test('should handle source and target cards in attack interventions', () => {
      const srcCard = new MockCard(1, 'Source', CardType.Hull, 1);
      const targetCard = new MockCard(2, 'Target', CardType.Hull, 1);
      const srcStack = new RootCardStack(srcCard, Zone.Hand, player);
      const targetStack = new RootCardStack(targetCard, Zone.Hand, player);
      
      const attackIntervention = new InterventionAttack(match as any, srcStack, targetStack);
      
      expect(attackIntervention.src).toBe(srcStack);
      expect(attackIntervention.target).toBe(targetStack);
    });

    test('should handle source and target cards in tactic interventions', () => {
      const srcCard = new MockCard(1, 'Source', CardType.Tactic, 1);
      const targetCard = new MockCard(2, 'Target', CardType.Hull, 1);
      const srcStack = new RootCardStack(srcCard, Zone.Hand, player);
      const targetStack = new RootCardStack(targetCard, Zone.Hand, player);
      
      const tacticIntervention = new InterventionTacticCard(match as any, srcStack, targetStack);
      
      expect(tacticIntervention.src).toBe(srcStack);
      expect(tacticIntervention.target).toBe(targetStack);
    });

    test('should distinguish between different card types in interventions', () => {
      const hullCard = new MockCard(1, 'Hull', CardType.Hull, 1);
      const tacticCard = new MockCard(2, 'Tactic', CardType.Tactic, 1);
      const hullStack = new RootCardStack(hullCard, Zone.Hand, player);
      const tacticStack = new RootCardStack(tacticCard, Zone.Hand, player);
      
      const attackIntervention = new InterventionAttack(match as any, hullStack, tacticStack);
      
      expect(attackIntervention.src.card.type).toBe(CardType.Hull);
      expect(attackIntervention.target.card.type).toBe(CardType.Tactic);
    });
  });

  describe('Intervention Match Integration', () => {
    test('should associate interventions with same match', () => {
      const attackIntervention = new InterventionAttack(
        match as any,
        new RootCardStack(new MockCard(1, 'Src', CardType.Hull, 1), Zone.Hand, player),
        new RootCardStack(new MockCard(2, 'Tgt', CardType.Hull, 1), Zone.Hand, player)
      );
      
      const roundIntervention = new InterventionBattleRoundStart(match as any);
      
      expect(attackIntervention.match).toBe(roundIntervention.match);
      expect(attackIntervention.match).toBe(match);
    });

    test('should maintain match reference through intervention lifecycle', () => {
      const srcCard = new MockCard(1, 'Source', CardType.Hull, 1);
      const targetCard = new MockCard(2, 'Target', CardType.Hull, 1);
      const srcStack = new RootCardStack(srcCard, Zone.Hand, player);
      const targetStack = new RootCardStack(targetCard, Zone.Hand, player);
      
      const intervention = new InterventionAttack(match as any, srcStack, targetStack);
      const originalMatch = intervention.match;
      
      expect(intervention.match).toBe(originalMatch);
    });
  });
});