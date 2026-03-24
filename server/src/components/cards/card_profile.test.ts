import CardProfile, { CardProfileConfig } from './card_profile';

describe('CardProfile', () => {
  describe('constructor and basic properties', () => {
    test('should create profile with default values when no config provided', () => {
      const profile = new CardProfile();
      expect(profile).toBeDefined();
      expect(profile.theta).toBe(0);
      expect(profile.xi).toBe(0);
      expect(profile.phi).toBe(0);
      expect(profile.omega).toBe(0);
      expect(profile.delta).toBe(0);
      expect(profile.psi).toBe(0);
    });

    test('should create profile with specified values', () => {
      const config: CardProfileConfig = {
        theta: 1,
        xi: -1,
        phi: 2,
        omega: -2,
        delta: 3,
        psi: -3
      };
      const profile = new CardProfile(config);
      expect(profile.theta).toBe(1);
      expect(profile.xi).toBe(-1);
      expect(profile.phi).toBe(2);
      expect(profile.omega).toBe(-2);
      expect(profile.delta).toBe(3);
      expect(profile.psi).toBe(-3);
    });

    test('should handle partial config', () => {
      const config: CardProfileConfig = {
        theta: 5,
        psi: -5
      };
      const profile = new CardProfile(config);
      expect(profile.theta).toBe(5);
      expect(profile.psi).toBe(-5);
      expect(profile.xi).toBe(0);
      expect(profile.phi).toBe(0);
    });
  });

  describe('profile calculations', () => {
    test('should calculate isValid correctly', () => {
      const profile1 = new CardProfile({ theta: 1, xi: 2, phi: 3 });
      const profile2 = new CardProfile({ theta: -1, xi: 2, phi: 3 });

      expect(profile1.isValid).toBe(true);
      expect(profile2.isValid).toBe(false); // has negative value
    });
  });

  describe('profile operations', () => {
    test('should combine profiles correctly', () => {
      const profile1 = new CardProfile({ theta: 1, xi: 2, phi: 3 });
      const profile2 = new CardProfile({ theta: 4, xi: 5, phi: 6 });

      const result = profile1.combine(profile2);
      expect(result.theta).toBe(5); // 1 + 4
      expect(result.xi).toBe(7); // 2 + 5
      expect(result.phi).toBe(9); // 3 + 6
    });
  });
});
