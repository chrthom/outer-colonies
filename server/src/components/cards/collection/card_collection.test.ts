import { CardType, TacticDiscipline } from '../../../shared/config/enums';
import CardProfile, { AttackProfile } from '../card_profile';
import EquipmentCard from '../types/equipment_card';
import TacticCard from '../types/tactic_card';
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

// Disciplines re-evaluated in issue #771 (517 explicitly stays Intelligence)
const reevaluatedTacticDisciplines: Record<number, TacticDiscipline> = {
  139: TacticDiscipline.Science,
  149: TacticDiscipline.Science,
  222: TacticDiscipline.Trade,
  417: TacticDiscipline.Military,
  517: TacticDiscipline.Intelligence
};
Object.entries(reevaluatedTacticDisciplines).forEach(([id, discipline]) => {
  test(`card ${id} should have the re-evaluated discipline ${discipline}`, () => {
    const card = CardCollection.cards[Number(id)];
    expect(card.type).toBe(CardType.Tactic);
    expect((<TacticCard>card).discipline).toBe(discipline);
  });
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

// Issue #795: unified rarity swap network - every swapped card took over its partner's
// csv slot, so ID and rarity trade together while name, values and type travel with the card
const swapNetwork: [id: number, name: string, rarity: number][] = [
  [101, 'Materiedesintegrator', 5],
  [109, 'Quantentorpedos', 4],
  [413, 'Plasmanachbrenner', 3],
  [223, 'Logistikknotenpunkt', 2],
  [207, 'Massebeschleuniger', 4],
  [103, 'Gauss Kanone', 5],
  [310, 'Adamantiumpanzer', 4],
  [115, 'Reparaturnaniten', 4],
  [104, 'Ablative Magnetpanzerung', 5],
  [151, 'Plasmakanone', 2],
  [125, 'Kinetikwaffenbatterie', 3],
  [164, 'Deflektorschild', 1],
  [140, 'Rüstungsschmiede', 2],
  [183, 'Bergbauaußenposten', 1],
  [154, 'Industriekomplex', 2],
  [237, 'Bergbaulaser', 1],
  [224, 'Mini-Railgun', 2],
  [320, 'Refraktorfeld', 2],
  [312, 'Legierungsgießerei', 3],
  [343, 'Selbstreparierender Torso', 1],
  [325, 'Laserphalanx', 2],
  [344, 'Marsianisches Konsulat', 1],
  [333, 'Fokuslaser', 2],
  [441, 'Leichtbauweise', 1],
  [434, 'Flechette-Werfer', 2],
  [448, 'Gewerbegebiet', 1],
  [435, 'Schildkuppel', 2],
  [522, 'Railgun', 2],
  [180, 'Heckdeflektor', 1],
  [412, 'Titanplattenpanzer', 3],
  [537, 'Langstreckentorpedos', 2],
  [171, 'Quantenmechanischer Antrieb', 1]
];
swapNetwork.forEach(([id, name, rarity]) => {
  test(`swapped card ${id} "${name}" should be registered with rarity ${rarity}`, () => {
    const card = CardCollection.cards[id as keyof typeof CardCollection.cards];
    expect(card.name).toBe(name);
    expect(card.rarity).toBe(rarity);
  });
});

// Issue #795: X switches - the attack deals 0 damage against that defence type
// and does not deactivate the defence card (server representation: -99)
const xSwitches: [id: number, defence: 'shield' | 'armour'][] = [
  [130, 'armour'],
  [157, 'shield'],
  [166, 'shield'],
  [179, 'shield'],
  [179, 'armour'],
  [333, 'shield'],
  [347, 'shield']
];
xSwitches.forEach(([id, defence]) => {
  test(`card ${id} should use an X deduction against ${defence}`, () => {
    const card = <EquipmentCard>CardCollection.cards[id as keyof typeof CardCollection.cards];
    expect(card.attackProfile?.[defence]).toBe(-99);
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
