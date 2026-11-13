import CardStack from '../cards/card_stack';
import Player from '../game_state/player';
import { BattleType, Zone } from '../../shared/config/enums';
import ClientPlannedBattle from '../../shared/interfaces/client_planned_battle';
import { opponentPlayerNo, pickRandom } from '../utils/helpers';
import EquipmentCard from '../cards/types/equipment_card';
import { AttackProfile } from '../cards/card_profile';

/**
 * The bot only declares a battle when its own fleet strength clearly exceeds
 * the opponent's strength by this factor.
 */
const battleStrengthFactor = 1.5;

/**
 * The bot only raids (instead of running a mission) when its own fleet
 * strength even exceeds the opponent's orbital defense by this factor, so a
 * merely superior fleet runs a mission while an overwhelming one attacks the
 * colony. A defenseless colony is always raided, as the factor then compares
 * against zero.
 */
const raidStrengthFactor = 2;

/** A single attack planned by the bot: one weapon against one target. */
export interface BotAttack {
  srcWeapon: CardStack;
  target: CardStack;
}

/**
 * Rough strength metric of a fleet: remaining hit points of every ship plus
 * the damage of all equipped weapons.
 */
export function fleetStrength(cardStacks: CardStack[]): number {
  return cardStacks.reduce((strength, cs) => {
    const weaponDamage = cs.cardStacks
      .map(sub => (<EquipmentCard>sub.card).attackProfile)
      .filter((ap): ap is AttackProfile => !!ap)
      .reduce((damage, ap) => damage + ap.damage, 0);
    return strength + Math.max(0, cs.profile.hp - cs.damage) + weaponDamage;
  }, 0);
}

/**
 * Selects the hand card the bot plays next: the affordable card with the
 * highest rarity; on a rarity tie the first one in draw order. Only cards with
 * at least one valid target are considered. Works for the bot's own build
 * phase as well as for intervention windows, as `hasValidTargets` already
 * respects the current intervention type.
 */
export function selectHandCard(hand: CardStack[]): CardStack | undefined {
  return hand
    .filter(cs => cs.hasValidTargets)
    .reduce<
      CardStack | undefined
    >((best, cs) => (!best || cs.card.rarity > best.card.rarity ? cs : best), undefined);
}

/**
 * Picks a random valid target for the given hand card. Returns undefined if
 * the card has no valid targets.
 */
export function selectTarget(handCard: CardStack): CardStack | undefined {
  const validTargets = handCard.validTargets;
  return validTargets.length > 0 ? pickRandom(validTargets) : undefined;
}

/**
 * Decides the battle the bot declares this turn: a raid with all
 * mission-ready ships when the opponent has no orbital defense or the bot's
 * fleet clearly overwhelms it, a mission when the fleet merely clearly
 * exceeds the opponent's potential defense, otherwise no battle.
 */
export function planBattle(player: Player): ClientPlannedBattle {
  const missionReadyShips = player.cardStacks.filter(cs => cs.isMissionReady);
  const opponent = player.match.players[opponentPlayerNo(player.no)];
  const opponentStrength = fleetStrength(opponent.cardStacks.filter(cs => cs.zone == Zone.Orbital));
  const ownStrength = fleetStrength(missionReadyShips);
  if (missionReadyShips.length > 0 && ownStrength >= opponentStrength * battleStrengthFactor) {
    const type = ownStrength >= opponentStrength * raidStrengthFactor ? BattleType.Raid : BattleType.Mission;
    return { type, shipIds: missionReadyShips.map(cs => cs.uuid) };
  }
  return { type: BattleType.None, shipIds: [] };
}

/**
 * Selects the ships the bot nominates as defense fleet when the opponent
 * declared a battle. Against a mission it intercepts with all interception
 * ready ships when its own strength is at least the attacker's strength,
 * otherwise it stays home. Against a raid it keeps all mission-ready ships in
 * orbit, as fleeing would leave the colony undefended.
 */
export function selectInterceptingShips(player: Player): string[] {
  const match = player.match;
  if (match.battle.type == BattleType.Mission) {
    const interceptors = player.cardStacks.filter(cs => cs.isInterceptionReady);
    const ownStrength = fleetStrength(interceptors);
    const attackerStrength = fleetStrength(match.battle.ships[match.activePlayerNo]);
    return ownStrength >= attackerStrength ? interceptors.map(cs => cs.uuid) : [];
  }
  return player.cardStacks.filter(cs => cs.isMissionReady).map(cs => cs.uuid);
}

/**
 * Selects the bot's next attack in the combat phase: the first available
 * weapon against the current focus target. If the focus target no longer
 * participates in the battle (e.g. it was destroyed), a random new target is
 * picked, so all weapons focus the same target until it is destroyed.
 * Returns undefined if the bot cannot attack.
 */
export function selectAttack(player: Player, focusTargetUUID?: string): BotAttack | undefined {
  const match = player.match;
  const srcWeapon = match.battle.ships[player.no].flatMap(ship => ship.cardStacks).find(cs => cs.canAttack);
  if (!srcWeapon) return undefined;
  const opponentShips = match.battle.ships[match.waitingPlayerNo];
  const focusTarget = focusTargetUUID ? opponentShips.find(cs => cs.uuid == focusTargetUUID) : undefined;
  const target = focusTarget ?? (opponentShips.length > 0 ? pickRandom(opponentShips) : undefined);
  return target ? { srcWeapon, target } : undefined;
}
