import { CardType } from '../../../shared/config/enums';
import CardProfile, { AttackProfile } from '../card_profile';
import EquipmentCard from '../types/equipment_card';
import CardCollection from './card_collection';

const allCards = CardCollection.allCards.sort((a, b) => a.id - b.id);

Object.entries(CardCollection.cards).forEach(([key, card]) => {
  test(`card registered under key ${key} should have matching id`, () => {
    expect(card.id).toBe(Number(key));
  });
});

test('no two registered cards should share the same id', () => {
  const ids = Object.values(CardCollection.cards).map(c => c.id);
  expect(new Set(ids).size).toBe(ids.length);
});

const equipmentCards = allCards.filter(c => c.type == CardType.Equipment);
const infrastructureCards = allCards.filter(c => c.type == CardType.Infrastructure);
const weaponCards = equipmentCards.map(c => <EquipmentCard>c).filter(c => c.canAttack);

equipmentCards
  .concat(infrastructureCards)
  .filter(c => ![124, 545].includes(c.id))
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
    expect(c2).toEqual(c);
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

// Regression test for issue #777: profiles of cards which were aligned with misc/cards.csv
const cardsAlignedWithCardsCsv: [number, CardProfile][] = [
  [112, new CardProfile({ shield: 1 })],
  [132, new CardProfile({ hp: 7, speed: 3, phi: 2, omega: 1, delta: 1 })],
  [213, new CardProfile({ hp: 7, speed: 3, theta: 3, omega: 1, delta: 1 })],
  [221, new CardProfile({ hp: 8, control: 3, theta: 2, omega: 1, psi: 1 })],
  [212, new CardProfile({ omega: -1, psi: -1, control: 3 })],
  [303, new CardProfile({ energy: -2, xi: -2 })],
  [326, new CardProfile({ hp: 12, control: 3, speed: -1, theta: 2, omega: 1, psi: 1 })],
  [327, new CardProfile({ hp: 8, speed: 2, omega: 2, delta: 1, psi: 1 })],
  [336, new CardProfile({ energy: -2, psi: -1 })],
  [348, new CardProfile({ hp: 5, control: 1, speed: 3, xi: 1, omega: 1, delta: 1 })]
];

cardsAlignedWithCardsCsv.forEach(([id, expectedProfile]) => {
  test(`"${CardCollection.cards[id].name}" (${id}) profile should match misc/cards.csv`, () => {
    expect(CardCollection.cards[id].profile).toEqual(expectedProfile);
  });
});

test('"Dual-Lasergeschütz" (182) attack damage should match misc/cards.csv', () => {
  const card = <EquipmentCard>CardCollection.cards[182];
  expect(card.attackProfile?.damage).toBe(6);
});
