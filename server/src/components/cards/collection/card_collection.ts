import { Rarity } from '../../../shared/config/enums';
import { starterDecks } from '../../../shared/config/starter_decks';
import Card from '../card';
import ColonyCard from '../types/colony_card';
import { allCards as equipmentDefenseCards } from './equipment_defense_cards';
import { allCards as equipmentUtilCards } from './equipment_util_cards';
import { allCards as equipmentWeaponKineticCards } from './equipment_weapon_kinetic_cards';
import { allCards as equipmentWeaponLaserCards } from './equipment_weapon_laser_cards';
import { allCards as equipmentWeaponParticleCards } from './equipment_weapon_particle_cards';
import { allCards as equipmentWeaponPlasmaCards } from './equipment_weapon_plasma_cards';
import { allCards as equipmentWeaponPointDefenseCards } from './equipment_weapon_point_defense_cards';
import { allCards as equipmentWeaponSuperCards } from './equipment_weapon_super_cards';
import { allCards as equipmentWeaponTorpedoCards } from './equipment_weapon_torpedo_cards';
import { allCards as hull1PartCards } from './hull_1_part_cards';
import { allCards as hull2PartCards } from './hull_2_part_cards';
import { allCards as hull3PartCards } from './hull_3_part_cards';
import { allCards as hullStationCards } from './hull_station_cards';
import { allCards as infrastructureActionCards } from './infrastructure_action_cards';
import { allCards as infrastructureDefenseCards } from './infrastructure_defense_cards';
import { allCards as infrastructureEndCards } from './infrastructure_end_cards';
import { allCards as infrastructureEnergyCards } from './infrastructure_energy_cards';
import { allCards as infrastructureSpecialCards } from './infrastructure_special_cards';
import { allCards as infrastructureStartCards } from './infrastructure_start_cards';
import { allCards as infrastructureUtilCards } from './infrastructure_util_cards';
import { allCards as orbCards } from './orb_cards';
import { allCards as tacticEconomyCards } from './tactic_economy_cards';
import { allCards as tacticIntelligenceCards } from './tactic_intelligence_cards';
import { allCards as tacticMilitaryCards } from './tactic_military_cards';
import { allCards as tacticScienceCards } from './tactic_science_cards';

const allCardInstances: Card[] = [
  new ColonyCard(),
  ...equipmentDefenseCards,
  ...equipmentUtilCards,
  ...equipmentWeaponKineticCards,
  ...equipmentWeaponLaserCards,
  ...equipmentWeaponParticleCards,
  ...equipmentWeaponPlasmaCards,
  ...equipmentWeaponPointDefenseCards,
  ...equipmentWeaponSuperCards,
  ...equipmentWeaponTorpedoCards,
  ...hull1PartCards,
  ...hull2PartCards,
  ...hull3PartCards,
  ...hullStationCards,
  ...infrastructureActionCards,
  ...infrastructureDefenseCards,
  ...infrastructureEndCards,
  ...infrastructureEnergyCards,
  ...infrastructureSpecialCards,
  ...infrastructureStartCards,
  ...infrastructureUtilCards,
  ...orbCards,
  ...tacticEconomyCards,
  ...tacticIntelligenceCards,
  ...tacticMilitaryCards,
  ...tacticScienceCards
];

export default class CardCollection {
  static cards: Record<number, Card> = Object.fromEntries(allCardInstances.map(c => [c.id, c]));
  static allCards: Card[] = allCardInstances;
  static starterDecks: Card[][] = starterDecks.map(sd =>
    sd
      .map(c => Array(c[0]).fill(c[1]))
      .flat()
      .map(cid => this.cards[cid as number])
  );

  static generateBoosterContent(edition: number): Card[] {
    const cards: Card[] = [];
    [Array(6).fill(Rarity.Common), Array(3).fill(Rarity.Uncommon), Array(1).fill(Rarity.Rare)]
      .flat()
      .forEach(rarity => {
        const pickAction = () => this.pickRandomCard(edition, rarity);
        const newCard = pickAction();
        cards.push(cards.some(c => c.id == newCard.id) ? pickAction() : newCard);
      });
    return cards;
  }

  private static pickRandomCard(edition: number, rarity: Rarity): Card {
    const relevantCards = this.allCards
      .filter(c => Math.floor(c.id / 100) == edition)
      .filter(
        c =>
          (rarity == Rarity.Common && c.rarity <= 1) ||
          (rarity == Rarity.Uncommon && c.rarity == 2) ||
          (rarity == Rarity.Rare && c.rarity >= 3)
      )
      .flatMap(c => {
        switch (c.rarity) {
          case 0:
            return Array(5).fill(c);
          case 1:
            return Array(4).fill(c);
          case 2:
            return [c];
          case 3:
            return Array(4).fill(c);
          case 4:
            return Array(2).fill(c);
          case 5:
            return [c];
        }
      });
    return relevantCards[Math.floor(Math.random() * relevantCards.length)];
  }
}
