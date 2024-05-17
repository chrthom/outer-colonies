import { CardType } from '../../../shared/config/enums';
import CardProfile, { AttackProfile } from '../card_profile';
import EquipmentCard from '../types/equipment_card';
import CardCollection from './card_collection';

const equipmentCards = CardCollection.allCards.filter(c => c.type == CardType.Equipment);
const infrastructureCards = CardCollection.allCards.filter(c => c.type == CardType.Infrastructure);
const weaponCards = equipmentCards.map(c => <EquipmentCard>c).filter(c => c.canAttack);

equipmentCards
  .concat(infrastructureCards)
  .filter(c => c.id != 124)
  .forEach(c => {
    ['theta', 'xi', 'phi', 'omega', 'delta', 'psi'].forEach(v => {
      test(`"${c.name}" profile ${v} socket value should be 0 or less`, () => {
        expect(c.profile[v as keyof CardProfile]).toBeLessThanOrEqual(0);
      });
    });
  });

weaponCards.forEach(c => {
  ['armour', 'shield', 'pointDefense'].forEach(v => {
    test(`"${c.name}" attack profile ${v} value should be 0 or less`, () => {
      expect(c.attackProfile).not.toBeUndefined();
      if (c.attackProfile) {
        expect(c.attackProfile[v as keyof AttackProfile]).toBeLessThanOrEqual(0);
      }
    });
  });
});

CardCollection.allCards.forEach(c => {
  test(`"${c.name}" rarity should be between 0 and 5`, () => {
    expect(c.rarity).toBeLessThanOrEqual(5);
    expect(c.rarity).toBeGreaterThanOrEqual(0);
  });
  test(`"${c.name}" card ID ${c.id} should match class name`, () => {
    const c2 = CardCollection.cards[c.id as keyof typeof CardCollection.cards];
    expect(c2).toBe(c);
  });
});
