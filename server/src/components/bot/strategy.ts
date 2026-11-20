import CardStack from '../cards/card_stack';
import Player from '../game_state/player';
import { BattleType, CardType, Zone } from '../../shared/config/enums';
import ClientPlannedBattle from '../../shared/interfaces/client_planned_battle';
import { opponentPlayerNo, pickRandom } from '../utils/helpers';
import EquipmentCard from '../cards/types/equipment_card';
import { AttackProfile } from '../cards/card_profile';

/**
 * The bot only raids when its own fleet strength clearly exceeds the
 * opponent's orbital defense by this factor. A defenseless colony is always
 * raided, as the factor then compares against zero.
 */
const raidStrengthFactor = 1.5;

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
 * Picks the target for the given hand card by priority (random choice on ties
 * within a priority): enemy ship in neutral or orbital zone, enemy card in
 * colony zone or the enemy colony itself, own ship in neutral or orbital
 * zone, own ship or other card in colony zone, own colony. Returns undefined
 * if the card has no valid targets.
 */
export function selectTarget(handCard: CardStack): CardStack | undefined {
  const isOwn = (target: CardStack) => target.rootCardStack.player.no == handCard.player.no;
  const isShip = (target: CardStack) => target.rootCardStack.type == CardType.Hull;
  const isColony = (target: CardStack) => target.rootCardStack.type == CardType.Colony;
  const isEnemyColonyZoneTarget = (target: CardStack) =>
    target.rootCardStack.zone == Zone.Colony || isColony(target);
  const isShipInCombatZone = (target: CardStack) =>
    isShip(target) &&
    (target.rootCardStack.zone == Zone.Neutral || target.rootCardStack.zone == Zone.Orbital);
  const priorities = [
    handCard.validTargets.filter(target => !isOwn(target) && isShipInCombatZone(target)),
    handCard.validTargets.filter(target => !isOwn(target) && isEnemyColonyZoneTarget(target)),
    handCard.validTargets.filter(target => isOwn(target) && isShipInCombatZone(target)),
    handCard.validTargets.filter(
      target => isOwn(target) && target.rootCardStack.zone == Zone.Colony && !isColony(target)
    ),
    handCard.validTargets.filter(target => isOwn(target) && isColony(target))
  ];
  for (const targets of priorities) {
    if (targets.length > 0) return pickRandom(targets);
  }
  return undefined;
}

/**
 * Decides the battle the bot declares this turn: a raid with all
 * mission-ready ships when the bot's fleet clearly exceeds the opponent's
 * orbital defense, otherwise a mission with the fastest mission-ready ships
 * when the fleet is at least as strong as the opponent's total fleet and
 * those fastest ships are at least as strong as the opponent ships in the
 * orbital zone fast enough to intercept them, otherwise no battle.
 */
export function planBattle(player: Player): ClientPlannedBattle {
  const missionReadyShips = player.cardStacks.filter(cs => cs.isMissionReady);
  if (missionReadyShips.length == 0) return { type: BattleType.None, shipIds: [] };
  const opponent = player.match.players[opponentPlayerNo(player.no)];
  const opponentShips = opponent.cardStacks.filter(cs => cs.type == CardType.Hull);
  const ownStrength = fleetStrength(missionReadyShips);
  const opponentOrbitalStrength = fleetStrength(opponentShips.filter(cs => cs.zone == Zone.Orbital));
  if (ownStrength >= opponentOrbitalStrength * raidStrengthFactor) {
    return { type: BattleType.Raid, shipIds: missionReadyShips.map(cs => cs.uuid) };
  }
  if (ownStrength >= fleetStrength(opponentShips)) {
    const maxSpeed = Math.max(...missionReadyShips.map(cs => cs.profile.speed));
    const fastestShips = missionReadyShips.filter(cs => cs.profile.speed == maxSpeed);
    const interceptors = opponentShips.filter(cs => cs.zone == Zone.Orbital && cs.profile.speed >= maxSpeed);
    if (fleetStrength(fastestShips) >= fleetStrength(interceptors)) {
      return { type: BattleType.Mission, shipIds: fastestShips.map(cs => cs.uuid) };
    }
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
 * weapon against the current focus target. Destroyed hulls are never pruned
 * from battle.ships (they are only removed from the player's card stacks at
 * the end of each battle round), so the target pool is filtered by aliveness:
 * a destroyed focus target releases the focus and destroyed hulls cannot be
 * picked as new targets, so all weapons focus the same target until it is
 * destroyed. Returns undefined if the bot cannot attack.
 */
export function selectAttack(player: Player, focusTargetUUID?: string): BotAttack | undefined {
  const match = player.match;
  const srcWeapon = match.battle.ships[player.no].flatMap(ship => ship.cardStacks).find(cs => cs.canAttack);
  if (!srcWeapon) return undefined;
  const opponentShips = match.battle.ships[match.waitingPlayerNo].filter(cs => cs.damage < cs.profile.hp);
  const focusTarget = focusTargetUUID ? opponentShips.find(cs => cs.uuid == focusTargetUUID) : undefined;
  const target = focusTarget ?? (opponentShips.length > 0 ? pickRandom(opponentShips) : undefined);
  return target ? { srcWeapon, target } : undefined;
}
