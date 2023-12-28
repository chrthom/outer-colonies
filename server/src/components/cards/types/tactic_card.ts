import { CardType, TacticDiscipline, CardDurability } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import { opponentPlayerNo } from '../../utils/helpers';
import Card from '../card';
import { CardProfileConfig } from '../card_profile';
import CardStack from '../card_stack';

export default abstract class TacticCard extends Card {
  constructor(id: number, name: string, rarity: number, profile?: CardProfileConfig) {
    super(id, name, CardType.Tactic, rarity, profile);
  }
  onLeaveGame() {}
  onStartTurn() {}
  onEndTurn() {}
  adjustedAttackDamageByIntervention(damage: number): number {
    return damage;
  }
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
  protected getOpponentPlayer(player: Player): Player {
    return player.match.players[opponentPlayerNo(player.no)];
  }
  protected onEnterGameAttackIntervention(player: Player, target: CardStack) {
    player.match.actionPendingByPlayerNo = player.match.getWaitingPlayerNo();
    const intervention = player.match.intervention;
    intervention.attackSrc.attack(target, this);
  }
}
