import {
  CardType,
  TacticDiscipline,
  CardDurability,
  InterventionType,
  Zone
} from '../../../shared/config/enums';
import { InterventionAttack, InterventionTacticCard } from '../../game_state/intervention';
import Player from '../../game_state/player';
import { opponentPlayerNo, spliceCardById, spliceFrom } from '../../utils/helpers';
import Card, { AttackResult, CardRarity } from '../card';
import { AttackProfile, CardProfileConfig } from '../card_profile';
import CardStack from '../card_stack';

export default abstract class TacticCard extends Card {
  readonly attackProfile?: AttackProfile;
  readonly discipline: TacticDiscipline;
  constructor(
    id: number,
    name: string,
    rarity: CardRarity,
    discipline: TacticDiscipline,
    profile?: CardProfileConfig,
    attackProfile?: AttackProfile
  ) {
    super(id, name, CardType.Tactic, rarity, profile);
    this.attackProfile = attackProfile;
    this.discipline = discipline;
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
  protected onlyColonyTarget(playersCardStacks: CardStack[]): CardStack[] {
    return playersCardStacks.filter(cs => cs.card.type == CardType.Colony);
  }
  protected onlyOpponentColonyTarget(player: Player): CardStack[] {
    return this.onlyColonyTarget(this.getOpponentPlayer(player).cardStacks);
  }
  protected onlyOpponentHullTarget(player: Player): CardStack[] {
    return this.getOpponentPlayer(player).cardStacks.filter(cs => cs.card.type == CardType.Hull);
  }
  protected getOpponentCardStacks(player: Player): CardStack[] {
    return this.getOpponentPlayer(player).cardStacks;
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
  protected tributeCardFromPile(
    optionalParameters: number[] | undefined,
    pile: Card[],
    action: (card: Card) => void
  ) {
    const cardId = optionalParameters?.[0];
    if (cardId === undefined) return;
    const card = spliceCardById(pile, cardId);
    if (card) action(card);
    else this.warnTributeNotFound();
  }
  protected tributeHandCard(
    player: Player,
    optionalParameters: number[] | undefined,
    action: (uuid: string) => void
  ) {
    const cardId = optionalParameters?.[0];
    if (cardId === undefined) return;
    const handCardUUID = player.hand.find(cs => cs.card.id == cardId)?.uuid;
    if (handCardUUID) action(handCardUUID);
    else this.warnTributeNotFound();
  }
  protected tributeMultipleFromPile(
    optionalParameters: number[] | undefined,
    pile: Card[],
    action: (card: Card) => void
  ) {
    optionalParameters?.forEach(cardId => {
      const card = spliceCardById(pile, cardId);
      if (card) action(card);
    });
  }
  private warnTributeNotFound() {
    console.log(`WARN: No card found for optional parameter when playing card '${this.name}'`);
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
  protected togglePointDefense(targets: CardStack[], count: number, newState: boolean) {
    let remaining = count;
    while (remaining > 0) {
      const pd2 = this.findPointDefense(targets, 2, !newState);
      const pd1 = this.findPointDefense(targets, 1, !newState);
      if (remaining >= 2 && pd2) {
        pd2.defenseAvailable = newState;
        remaining -= 2;
      } else if (pd1) {
        pd1.defenseAvailable = newState;
        remaining -= 1;
      } else {
        break;
      }
    }
  }
  private findPointDefense(
    targets: CardStack[],
    level: number,
    currentlyAvailable: boolean
  ): CardStack | undefined {
    return targets
      .flatMap(cs => cs.cardStacks)
      .find(cs => cs.defenseAvailable == currentlyAvailable && cs.card.profile.pointDefense == level);
  }
  protected attackByTactic(player: Player, target: CardStack) {
    if (this.attackProfile) {
      const defendingShips = target.player.cardStacks.filter(cs => cs.zone != Zone.Neutral);
      const attackResult = this.attackStep(
        target,
        this.attackProfile,
        defendingShips,
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
      this.rechargePerAttackDefenders(defendingShips);
      player.match.removeDestroyedCardStacks();
    }
  }
}
