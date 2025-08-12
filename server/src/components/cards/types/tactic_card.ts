import {
  CardType,
  TacticDiscipline,
  CardDurability,
  InterventionType,
  Zone
} from '../../../shared/config/enums';
import { InterventionAttack, InterventionTacticCard } from '../../game_state/intervention';
import Player from '../../game_state/player';
import { opponentPlayerNo, spliceFrom } from '../../utils/helpers';
import Card, { AttackResult, CardRarity } from '../card';
import { AttackProfile, CardProfileConfig } from '../card_profile';
import CardStack from '../card_stack';

export default abstract class TacticCard extends Card {
  readonly attackProfile?: AttackProfile;
  constructor(
    id: number,
    name: string,
    rarity: CardRarity,
    profile?: CardProfileConfig,
    attackProfile?: AttackProfile
  ) {
    super(id, name, CardType.Tactic, rarity, profile);
    this.attackProfile = attackProfile;
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
    const intervention = <InterventionAttack>player.match.intervention;
    player.match.intervention = undefined;
    intervention.src.attack(target, this);
  }
  protected onEnterGameInterventionTacticCard(player: Player) {
    player.match.switchPendingPlayer();
    const intervention = <InterventionTacticCard>player.match.intervention;
    intervention.src.discard();
    player.match.intervention = intervention.parentIntervention;
    player.match.intervention?.skip();
  }
  protected getValidTargetsInterventionAttack(
    player: Player,
    condition: (i: InterventionAttack) => boolean
  ): CardStack[] {
    if (player.match.intervention?.type == InterventionType.Attack) {
      const intervention = <InterventionAttack>player.match.intervention;
      return condition(intervention) ? [intervention.target] : [];
    }
    return [];
  }
  protected getValidTargetsInterventionTacticCard(
    player: Player,
    disciplines: TacticDiscipline[]
  ): CardStack[] {
    if (player.match.intervention?.type == InterventionType.TacticCard) {
      const intervention = <InterventionTacticCard>player.match.intervention;
      return disciplines.includes((<TacticCard>intervention.src.card).discipline)
        ? this.onlyColonyTarget(player.match.waitingPlayer.cardStacks)
        : [];
    }
    return [];
  }
  protected drawSpecificCards(
    player: Player,
    matchFunction: (card: Card, player: Player) => boolean,
    cardsToDraw: number = 1
  ) {
    for (let i = 0; i < cardsToDraw; i++) {
      const card = spliceFrom(player.deck, (c: Card) => matchFunction(c, player));
      if (card) player.takeCard(card);
    }
    player.shuffleDeck();
  }
  protected attackByTactic(player: Player, target: CardStack) {
    if (this.attackProfile) {
      const attackResult = this.attackStep(
        target,
        this.attackProfile,
        target.player.cardStacks.filter(cs => cs.zone != Zone.Neutral),
        new AttackResult(this.attackProfile.damage)
      );
      target.damage += attackResult.damage;
      player.match.battle.recentAttack = {
        sourceRootUUID: player.colonyCardStack.uuid,
        sourceSubUUID: player.colonyCardStack.uuid,
        targetUUID: target.uuid,
        pointDefense: attackResult.pointDefense,
        shield: attackResult.shield,
        armour: attackResult.armour,
        damage: attackResult.damage
      };
      player.match.removeDestroyedCardStacks();
    }
  }
}
