import { CardType, TacticDiscipline, CardDurability } from '../../config/enums';
import Player from '../../game_state/player';
import Card from '../card';
import { CardProfileConfig } from '../card_profile';
import CardStack from '../card_stack';

export default abstract class TacticCard extends Card {
  constructor(id: number, name: string, rarity: number, profile?: CardProfileConfig) {
    super(id, name, CardType.Tactic, rarity, profile);
  }
  onLeaveGame() {}
  onStartTurn(player: Player) {}
  onEndTurn() {}
  override canBeRetracted(): boolean {
    return false;
  }
  override get durability(): CardDurability {
    return CardDurability.Instant;
  }
  abstract get discipline(): TacticDiscipline;
  protected onlyColonyTarget(playersCardStacks: CardStack[]): CardStack[] {
    return playersCardStacks.filter(cs => cs.card.type == CardType.Colony);
  }
}
