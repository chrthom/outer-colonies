import { CardType } from '../../../shared/config/enums';
import CardProfile, { AttackProfile } from '../card_profile';
import EquipmentCard from '../types/equipment_card';
import CardCollection from './card_collection';

const allCards = CardCollection.allCards.sort((a, b) => a.id - b.id);
const equipmentCards = allCards.filter(c => c.type == CardType.Equipment);
const infrastructureCards = allCards.filter(c => c.type == CardType.Infrastructure);
const weaponCards = equipmentCards.map(c => <EquipmentCard>c).filter(c => c.canAttack);

equipmentCards
  .concat(infrastructureCards)
  .filter(c => c.id != 124)
  .forEach(c => {
    ['theta', 'xi', 'phi', 'omega', 'delta', 'psi'].forEach(v => {
      test(`"${c.name}" (${c.id}) profile ${v} socket value should be 0 or less`, () => {
        expect(c.profile[v as keyof CardProfile]).toBeLessThanOrEqual(0);
      });
    });
  });

weaponCards.forEach(c => {
  ['armour', 'shield', 'pointDefense'].forEach(v => {
    test(`"${c.name}" (${c.id}) attack profile ${v} value should be 0 or less`, () => {
      expect(c.attackProfile).not.toBeUndefined();
      if (c.attackProfile) {
        expect(c.attackProfile[v as keyof AttackProfile]).toBeLessThanOrEqual(0);
      }
    });
  });
});

allCards.forEach((c, index, a) => {
  test(`"${c.name}" (${c.id}) rarity should be between 0 and 5`, () => {
    expect(c.rarity).toBeLessThanOrEqual(5);
    expect(c.rarity).toBeGreaterThanOrEqual(0);
  });
  test(`"${c.name}" (${c.id}) card ID should match class name`, () => {
    const c2 = CardCollection.cards[c.id as keyof typeof CardCollection.cards];
    expect(c2).toBe(c);
  });
  if (index + 1 == a.length || Math.floor(c.id / 100) < Math.floor(a[index + 1].id / 100)) {
    test(`"${c.name}" (${c.id}) rarity should be between 0 as last card of edition`, () => {
      expect(c.rarity).toBe(0);
    });
  } else {
    test(`"${c.name}" (${c.id}) rarity should be greater than or equal to "${a[index + 1].name}" (${
      a[index + 1].id
    }) rarity`, () => {
      expect(c.rarity).toBeGreaterThanOrEqual(a[index + 1].rarity);
    });
  }
});
