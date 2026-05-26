import { IconService } from './icon.service';

describe('IconService', () => {
  let service: IconService;

  beforeEach(() => {
    service = new IconService();
  });

  describe('getIcon', () => {
    it('should return the unicode character for a known icon name', () => {
      expect(service.getIcon('hp')).toBe('');
      expect(service.getIcon('damage')).toBe('');
      expect(service.getIcon('energy')).toBe('');
    });

    it('should lowercase the lookup so case does not matter', () => {
      expect(service.getIcon('HP')).toBe('');
      expect(service.getIcon('Damage')).toBe('');
    });

    it('should map all three armour and shield variants to the same code point', () => {
      const armour = service.getIcon('armour');
      expect(service.getIcon('armour_1')).toBe(armour);
      expect(service.getIcon('armour_2')).toBe(armour);
      expect(service.getIcon('armour_3')).toBe(armour);

      const shield = service.getIcon('shield');
      expect(service.getIcon('shield_1')).toBe(shield);
      expect(service.getIcon('shield_2')).toBe(shield);
      expect(service.getIcon('shield_3')).toBe(shield);
    });

    it('should return null for an unknown icon name', () => {
      expect(service.getIcon('not-an-icon')).toBeNull();
    });
  });

  describe('getIconHtml', () => {
    it('should return the uppercase hex HTML entity for a known icon', () => {
      expect(service.getIconHtml('hp')).toBe('&#xEA06;');
      expect(service.getIconHtml('damage')).toBe('&#xEA03;');
    });

    it('should return null for an unknown icon', () => {
      expect(service.getIconHtml('not-an-icon')).toBeNull();
    });
  });

  describe('getIconClass', () => {
    it('should prefix the lowercased name with oc-icon-', () => {
      expect(service.getIconClass('HP')).toBe('oc-icon-hp');
      expect(service.getIconClass('Point_Defense_1')).toBe('oc-icon-point_defense_1');
    });

    it('should return a class for any input, including unknown names', () => {
      expect(service.getIconClass('not-an-icon')).toBe('oc-icon-not-an-icon');
    });
  });

  describe('hasIcon', () => {
    it('should be true for known icons regardless of case', () => {
      expect(service.hasIcon('hp')).toBeTrue();
      expect(service.hasIcon('HP')).toBeTrue();
    });

    it('should be false for unknown icons', () => {
      expect(service.hasIcon('not-an-icon')).toBeFalse();
    });
  });

  describe('getAvailableIcons', () => {
    it('should list every known icon key', () => {
      const icons = service.getAvailableIcons();
      expect(icons).toContain('hp');
      expect(icons).toContain('armour_3');
      expect(icons).toContain('shield_3');
      expect(icons).toContain('tactic');
    });
  });
});
