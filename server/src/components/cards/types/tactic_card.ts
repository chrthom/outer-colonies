import { CardType, TacticDiscipline, CardDurability, InterventionType } from '../../../shared/config/enums';
import { InterventionAttack, InterventionTacticCard } from '../../game_state/intervention';
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
    player.match.switchPendingPlayer();
    const intervention = player.match.intervention as InterventionAttack;
    player.match.intervention = undefined;
    intervention.src.attack(target, this);
  }
  protected onEnterGameInterventionTacticCard(player: Player) {
    player.match.switchPendingPlayer();
    const intervention = player.match.intervention as InterventionTacticCard;
    intervention.src.discard();
    player.match.intervention = intervention.parentIntervention;
    player.match.intervention?.skip();
  }
  protected getValidTargetsInterventionAttack(
    player: Player,
    condition: (i: InterventionAttack) => boolean
  ): CardStack[] {
    if (player.match.intervention?.type == InterventionType.Attack) {
      const intervention = player.match.intervention as InterventionAttack;
      return condition(intervention) ? [intervention.target] : [];
    }
    return [];
  }
  protected getValidTargetsInterventionTacticCard(
    player: Player,
    disciplines: TacticDiscipline[]
  ): CardStack[] {
    if (player.match.intervention?.type == InterventionType.TacticCard) {
      const intervention = player.match.intervention as InterventionTacticCard;
      return disciplines.includes((intervention.src.card as TacticCard).discipline)
        ? this.onlyColonyTarget(player.match.waitingPlayer.cardStacks)
        : [];
    }
    return [];
  }
}
