import Player from '../../game_state/player';
import CardStack from '../card_stack';
import EquipmentCard, { EquipmentCardRechargeable } from './equipment_card';

/**
 * Abstract base class for shield-based defense equipment cards.
 * Automatically filters out targets that already have a Refraktorfeld (Card 312) attached.
 */
export abstract class ShieldDefenseCard extends EquipmentCardRechargeable {
  override getValidTargets(player: Player): CardStack[] {
    return super.getValidTargets(player).filter(cs => !cs.cards.find(c => c.id == 312)); // Cannot be attached if "Refraktorfeld" is already attached
  }
}