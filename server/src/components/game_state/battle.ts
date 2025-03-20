import Card from '../cards/card';
import CardStack from '../cards/card_stack';
import EquipmentCard from '../cards/types/equipment_card';
import { BattleType, Zone } from '../../shared/config/enums';
import { rules } from '../../shared/config/rules';
import ClientPlannedBattle from '../../shared/interfaces/client_planned_battle';
import toBattle from '../converters/client_planned_battle_converter';
import { getCardStackByUUID, spliceCardStackByUUID } from '../utils/helpers';
import Match from './match';
import Player from './player';
import { AttackProfile } from '../cards/card_profile';

export interface Attack {
  sourceUUID: string;
  sourceIndex: number;
  targetUUID: string;
  pointDefense: number;
  shield: number;
  armour: number;
  damage: number;
}

export default class Battle {
  type!: BattleType;
  ships: CardStack[][] = [[], []];
  downsidePriceCards: Card[] = [];
  upsidePriceCards: Card[] = [];
  range: number = rules.maxRange + 1;
  activePlayerNo: number;
  recentAttack?: Attack;
  constructor(type: BattleType, activePlayerNo: number) {
    this.type = type;
    this.activePlayerNo = activePlayerNo;
  }
  static fromClientPlannedBattle(match: Match, plannedBattle: ClientPlannedBattle): Battle {
    const battle = toBattle(match, plannedBattle);
    if (battle.type != BattleType.None) {
      battle.ships[match.pendingActionPlayerNo].forEach(cs => (cs.zone = Zone.Neutral));
    }
    return battle;
  }
  assignInterceptingShips(player: Player, interceptingShipIds: string[]) {
    if (this.type == BattleType.Mission) {
      this.ships[player.no] = interceptingShipIds
        .map(id => getCardStackByUUID(player.cardStacks, id))
        .filter((cs): cs is CardStack => !!cs && cs.isMissionReady);
      this.ships[player.no].map(cs => (cs.zone = Zone.Neutral));
    } else if (this.type == BattleType.Raid) {
      player.cardStacks
        .filter(cs => cs.isMissionReady && !interceptingShipIds.includes(cs.uuid))
        .forEach(cs => (cs.zone = Zone.Neutral));
      this.ships[player.no] = player.cardStacks.filter(cs => cs.zone == Zone.Orbital);
    }
  }
  processBattleRound(match: Match) {
    match.pendingActionPlayerNo = match.waitingPlayerNo;
    if (this.range == 0) {
      if (this.type == BattleType.Mission) this.applyMissionResult(match);
      match.prepareEndPhase();
    } else {
      const hasAttack = this.ships[match.pendingActionPlayerNo]
        .flatMap(cs => cs.cardStacks)
        .filter(cs => cs.attackAvailable)
        .map(cs => (<EquipmentCard>cs.card).attackProfile)
        .filter((ap): ap is AttackProfile => !!ap)
        .some(ap => ap.range >= this.range);
      const hasTarget = this.ships[match.waitingPlayerNo].length > 0;
      if (!hasAttack || !hasTarget) match.processBattleRound();
    }
  }
  processEndOfBattlePhase(match: Match) {
    this.range--;
    match.removeDestroyedCardStacks().forEach(cs => {
      match.players.forEach(player => {
        if (getCardStackByUUID(player.cardStacks, cs.uuid)) {
          spliceCardStackByUUID(player.cardStacks, cs.uuid);
        }
      });
    });
    match.reactivateAllCardStacks(true);
    if (this.range == 1 && this.type == BattleType.Raid) {
      this.ships[match.pendingActionPlayerNo].push(
        ...match.players[match.pendingActionPlayerNo].cardStacks.filter(cs => cs.zone == Zone.Colony)
      );
    }
  }
  resetRecentAttack() {
    this.recentAttack = undefined;
  }
  get missionSpeedRequirement(): number {
    return this.type == BattleType.Mission
      ? this.ships[this.activePlayerNo].map(cs => cs.profile.speed).reduce((a, b) => Math.min(a, b))
      : 0;
  }
  private applyMissionResult(match: Match) {
    const player = match.activePlayer;
    if (this.ships[match.activePlayerNo].length > 0) {
      player.takeCards(this.downsidePriceCards);
      player.deck.push(...this.upsidePriceCards);
    } else {
      player.discardCards(...this.downsidePriceCards.concat(this.upsidePriceCards));
    }
  }
  private getDestroyedCardStacks(playerNo: number): CardStack[] {
    return this.ships[playerNo].filter(cs => cs.damage > 0 && cs.damage >= cs.profile.hp);
  }
}
