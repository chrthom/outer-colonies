import { Injectable } from '@angular/core';
import { editions } from '@shared/config/editions';
import { TacticDiscipline } from '@shared/config/enums';

/**
 * Service mapping card metadata (edition, type, defense, rarity, discipline) to German display labels.
 * Extracted from the deck page so the mappings are reusable across pages - a first step towards bilingual support.
 */
@Injectable({
  providedIn: 'root'
})
export class CardMetaService {
  /**
   * Get the name of the edition a card belongs to.
   * @param cardId The card ID (edition = hundreds digit)
   * @returns The edition name, or an empty string for unknown editions
   */
  cardIdToEditionName(cardId: number): string {
    return editions[Math.floor(cardId / 100)] ?? '';
  }

  /**
   * Get the German label for a tactic discipline.
   * @param discipline The discipline, if the card has one
   * @returns The German discipline label, or an empty string
   */
  disciplineToText(discipline?: TacticDiscipline): string {
    switch (discipline) {
      case TacticDiscipline.Intelligence:
        return 'Information';
      case TacticDiscipline.Military:
        return 'Militär';
      case TacticDiscipline.Science:
        return 'Wissenschaft';
      case TacticDiscipline.Trade:
        return 'Wirtschaft';
      default:
        return '';
    }
  }

  /**
   * Get the German label for a card type.
   * @param type The card type identifier
   * @returns The German type label, or an empty string for unknown types
   */
  typeTooltip(type: string): string {
    switch (type) {
      case 'hull':
        return 'Rumpf';
      case 'equipment':
        return 'Ausrüstung';
      case 'infrastructure':
        return 'Infrastruktur';
      case 'orb':
        return 'Himmelskörper';
      case 'tactic':
        return 'Taktik';
      default:
        return '';
    }
  }

  /**
   * Get the German label for a defense attribute.
   * @param defense The defense identifier (e.g. 'armour_1')
   * @returns The German defense label, or an empty string for unknown defenses
   */
  defenseTooltip(defense: string): string {
    switch (defense) {
      case 'armour_1':
        return '1x Panzerung';
      case 'armour_2':
        return '2x Panzerung';
      case 'armour_3':
        return '3x Panzerung';
      case 'shield_1':
        return '1x Schild';
      case 'shield_2':
        return '2x Schild';
      case 'point_defense_1':
        return '1x Punktabwehr';
      case 'point_defense_2':
        return '2x Punktabwehr';
      default:
        return '';
    }
  }

  /**
   * Get the German label for a rarity tier.
   * @param rarity The rarity tier (0-5)
   * @returns The German rarity label, or an empty string for unknown tiers
   */
  rarityTooltip(rarity: number): string {
    switch (rarity) {
      case 0:
        return 'Häufig';
      case 1:
        return 'Gewöhnlich';
      case 2:
        return 'Ungewöhnlich';
      case 3:
        return 'Selten';
      case 4:
        return 'Außergewöhnlich';
      case 5:
        return 'Legendär';
      default:
        return '';
    }
  }
}
