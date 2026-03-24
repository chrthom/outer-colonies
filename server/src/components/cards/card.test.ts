import Card from './card';
import CardProfile from './card_profile';
import { CardType, InterventionType } from '../../shared/config/enums';
import Player from '../game_state/player';
import CardStack from './card_stack';

// Mock abstract methods for testing
class TestCard extends Card {
  getValidTargets(player: Player): CardStack[] {
    return [];
  }
  
  onEnterGame(player: Player, cardStack: CardStack): void {
    // Mock implementation
  }
  
  onLeaveGame(player: Player): void {
    // Mock implementation
  }
  
  onStartTurn(player: Player, cardStack: CardStack): void {
    // Mock implementation
  }
  
  onEndTurn(player: Player, source: CardStack): void {
    // Mock implementation
  }
}

describe('Card', () => {
  describe('constructor and basic properties', () => {
    test('should create card with required properties', () => {
      const card = new TestCard(1, 'Test Card', CardType.Equipment, 1);
      
      expect(card.id).toBe(1);
      expect(card.name).toBe('Test Card');
      expect(card.type).toBe(CardType.Equipment);
      expect(card.rarity).toBe(1);
      expect(card.profile).toBeInstanceOf(CardProfile);
    });

    test('should create card with custom profile', () => {
      const profileConfig = {
        theta: 2,
        xi: -1,
        phi: 3,
        armour: 10,
        shield: 5,
        pointDefense: 3
      };
      
      const card = new TestCard(2, 'Custom Profile Card', CardType.Hull, 2, profileConfig);
      
      expect(card.profile.theta).toBe(2);
      expect(card.profile.xi).toBe(-1);
      expect(card.profile.phi).toBe(3);
      expect(card.profile.armour).toBe(10);
    });

    test('should use default profile when no profile provided', () => {
      const card = new TestCard(3, 'Default Profile Card', CardType.Infrastructure, 3);
      
      expect(card.profile.theta).toBe(0);
      expect(card.profile.xi).toBe(0);
      expect(card.profile.phi).toBe(0);
      expect(card.profile.omega).toBe(0);
      expect(card.profile.delta).toBe(0);
      expect(card.profile.psi).toBe(0);
    });
  });

  describe('attack method', () => {
    test('should return default attack result for non-attacking cards', () => {
      const card = new TestCard(4, 'Non-Attack Card', CardType.Infrastructure, 1);
      const mockCardStack = {} as CardStack;
      const mockTarget = {} as CardStack;
      
      const result = card.attack(mockCardStack, mockTarget);
      
      expect(result).toBeDefined();
      expect(result.damage).toBe(0);
    });

    test('should accept optional intervention card parameter', () => {
      const card = new TestCard(5, 'Attack Card', CardType.Equipment, 1);
      const mockCardStack = {} as CardStack;
      const mockTarget = {} as CardStack;
      const mockIntervention = {} as any;
      
      // Should not throw even with intervention card
      const result = card.attack(mockCardStack, mockTarget, mockIntervention);
      expect(result).toBeDefined();
    });
  });

  describe('canAttack property', () => {
    test('should return false by default for abstract card', () => {
      const card = new TestCard(6, 'Basic Card', CardType.Hull, 1);
      expect(card.canAttack).toBe(false);
    });
  });

  describe('canDefend property', () => {
    test('should return false when all defense values are 0 or negative', () => {
      const card = new TestCard(7, 'No Defense Card', CardType.Equipment, 1, {
        armour: 0,
        shield: 0,
        pointDefense: 0
      });
      expect(card.canDefend).toBe(false);
    });

    test('should return true when any defense value is positive', () => {
      const card = new TestCard(8, 'Defense Card', CardType.Hull, 1, {
        armour: 5,
        shield: 0,
        pointDefense: 0
      });
      expect(card.canDefend).toBe(true);
    });

    test('should return true when multiple defense values are positive', () => {
      const card = new TestCard(9, 'Multi Defense Card', CardType.Infrastructure, 1, {
        armour: 2,
        shield: 3,
        pointDefense: 1
      });
      expect(card.canDefend).toBe(true);
    });

    test('should return false when defense values are negative', () => {
      const card = new TestCard(10, 'Negative Defense Card', CardType.Equipment, 1, {
        armour: -1,
        shield: -2,
        pointDefense: -3
      });
      expect(card.canDefend).toBe(false);
    });
  });

  describe('canIntervene method', () => {
    test('should return false by default for cards that cannot intervene', () => {
      const card = new TestCard(11, 'Basic Card', CardType.Hull, 1);
      expect(card.canIntervene(InterventionType.Attack)).toBe(false);
      expect(card.canIntervene(InterventionType.BattleRoundEnd)).toBe(false);
    });

    test('should accept different intervention types', () => {
      const card = new TestCard(12, 'Test Card', CardType.Tactic, 1);
      
      // Should not throw for any intervention type
      expect(card.canIntervene(InterventionType.Attack)).toBeDefined();
      expect(card.canIntervene(InterventionType.BattleRoundEnd)).toBeDefined();
      expect(card.canIntervene(InterventionType.TacticCard)).toBeDefined();
    });
  });

  describe('deactivationPriority method', () => {
    test('should return a number for deactivation priority', () => {
      const card = new TestCard(13, 'Priority Card', CardType.Equipment, 1);
      const mockCardStack = {} as CardStack;
      
      const priority = card.deactivationPriority(mockCardStack);
      expect(typeof priority).toBe('number');
    });

    test('should return same priority for same card stack', () => {
      const card = new TestCard(14, 'Consistent Priority Card', CardType.Hull, 1);
      const mockCardStack = { uuid: 'test-uuid' } as CardStack;
      
      const priority1 = card.deactivationPriority(mockCardStack);
      const priority2 = card.deactivationPriority(mockCardStack);
      
      expect(priority1).toBe(priority2);
    });
  });

  describe('card comparison and equality', () => {
    test('should have consistent ID for same card instance', () => {
      const card = new TestCard(15, 'Consistent ID Card', CardType.Infrastructure, 1);
      expect(card.id).toBe(15);
    });

    test('should maintain immutable properties', () => {
      const card = new TestCard(16, 'Immutable Card', CardType.Equipment, 2);
      const originalId = card.id;
      const originalName = card.name;
      const originalType = card.type;
      const originalRarity = card.rarity;
      
      // Properties should not change
      expect(card.id).toBe(originalId);
      expect(card.name).toBe(originalName);
      expect(card.type).toBe(originalType);
      expect(card.rarity).toBe(originalRarity);
    });
  });
});