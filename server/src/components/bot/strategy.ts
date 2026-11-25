import { BattleType, CardType, Zone } from '../../shared/config/enums';
import ClientPlannedBattle from '../../shared/interfaces/client_planned_battle';
import { ClientCardStack, ClientHandCard, ClientState } from '../../shared/interfaces/client_state';
import CardCollection from '../cards/collection/card_collection';
import { AttackProfile } from '../cards/card_profile';
import EquipmentCard from '../cards/types/equipment_card';
import { pickRandom } from '../utils/helpers';

/**
 * The bot only raids when its own fleet strength clearly exceeds the
 * opponent's orbital defense by this factor. A defenseless colony is always
 * raided, as the factor then compares against zero.
 */
const raidStrengthFactor = 1.5;

/** A single attack planned by the bot: one weapon against one target. */
export interface BotAttack {
  shipUUID: string;
  weaponUUID: string;
  targetUUID: string;
}

/** A single retractable card identified by its root stack and sub-stack UUID. */
export interface BotRetractTarget {
  rootUUID: string;
  subUUID: string;
}

function stackAttribute(stack: ClientCardStack, icon: string): number {
  return stack.attributes.find(a => a.icon == icon)?.value ?? 0;
}

function stackHp(stack: ClientCardStack): number {
  const attr = stack.attributes.find(a => a.icon == 'hp')?.value;
  if (attr !== undefined) return attr;
  return stack.cards.reduce((hp, c) => hp + (CardCollection.cards[c.id]?.profile.hp ?? 0), 0);
}

function stackSpeed(stack: ClientCardStack): number {
  return stack.cards.reduce((speed, c) => speed + (CardCollection.cards[c.id]?.profile.speed ?? 0), 0);
}

function isStackOfType(stack: ClientCardStack, type: CardType): boolean {
  return stack.cards.some(c => CardCollection.cards[c.id]?.type == type);
}

/**
 * Rough strength metric of a fleet: remaining hit points of every ship plus
 * the damage of all equipped weapons.
 */
export function fleetStrength(cardStacks: ClientCardStack[]): number {
  return cardStacks.reduce((strength, cs) => {
    const damage = stackAttribute(cs, 'damage');
    const hp = stackHp(cs);
    const weaponDamage = cs.cards
      .map(c => (<EquipmentCard>CardCollection.cards[c.id])?.attackProfile)
      .filter((ap): ap is AttackProfile => !!ap)
      .reduce((total, ap) => total + ap.damage, 0);
    return strength + Math.max(0, hp - damage) + weaponDamage;
  }, 0);
}

/**
 * Selects the hand card the bot plays next from its client-projected hand: the
 * playable card with the highest rarity (first in draw order on ties). Cards
 * that require option selection without enough available options are skipped.
 */
export function selectHandCard(hand: ClientHandCard[]): ClientHandCard | undefined {
  return hand
    .filter(
      hc =>
        hc.playable &&
        hc.validTargets.length > 0 &&
        (hc.optionsToSelect == 0 || (hc.options?.length ?? 0) >= hc.optionsToSelect)
    )
    .reduce<ClientHandCard | undefined>((best, hc) => {
      const rarity = CardCollection.cards[hc.cardId]?.rarity ?? 0;
      const bestRarity = best ? (CardCollection.cards[best.cardId]?.rarity ?? 0) : -1;
      return !best || rarity > bestRarity ? hc : best;
    }, undefined);
}

/**
 * Selects the required number of card options for a hand card that prompts an
 * option picker, or undefined when no options are required.
 */
export function selectCardOptions(handCard: ClientHandCard): number[] | undefined {
  if (handCard.optionsToSelect <= 0) return undefined;
  return handCard.options?.slice(0, handCard.optionsToSelect);
}

/**
 * Picks the target for the given hand card from the client state by priority
 * (random choice on ties within a priority): enemy ship in neutral or orbital
 * zone, enemy card in colony zone or the enemy colony itself, own ship in
 * neutral or orbital zone, own ship or other card in colony zone, own colony.
 * Returns undefined if none of the card's valid targets exist in the state.
 */
export function selectTarget(handCard: ClientHandCard, state: ClientState): ClientCardStack | undefined {
  const validTargets = handCard.validTargets
    .map(uuid => state.cardStacks.find(cs => cs.uuid == uuid))
    .filter((cs): cs is ClientCardStack => !!cs);
  const isOwn = (target: ClientCardStack) => target.ownedByPlayer;
  const isShip = (target: ClientCardStack) => isStackOfType(target, CardType.Hull);
  const isColony = (target: ClientCardStack) => isStackOfType(target, CardType.Colony);
  const isEnemyColonyZoneTarget = (target: ClientCardStack) => target.zone == Zone.Colony || isColony(target);
  const isShipInCombatZone = (target: ClientCardStack) =>
    isShip(target) && (target.zone == Zone.Neutral || target.zone == Zone.Orbital);
  const priorities = [
    validTargets.filter(target => !isOwn(target) && isShipInCombatZone(target)),
    validTargets.filter(target => !isOwn(target) && isEnemyColonyZoneTarget(target)),
    validTargets.filter(target => isOwn(target) && isShipInCombatZone(target)),
    validTargets.filter(target => isOwn(target) && target.zone == Zone.Colony && !isColony(target)),
    validTargets.filter(target => isOwn(target) && isColony(target))
  ];
  for (const targets of priorities) {
    if (targets.length > 0) return pickRandom(targets);
  }
  return undefined;
}

/**
 * Picks a retractable insufficient-energy card stack to retract during the
 * build phase (lowest energy contribution first, matching automatic retraction).
 */
export function selectRetractableCard(state: ClientState): BotRetractTarget | undefined {
  const candidates = state.cardStacks
    .filter(cs => cs.ownedByPlayer)
    .flatMap(cs =>
      cs.cards
        .filter(c => c.insufficientEnergy && c.retractable)
        .map(c => ({
          rootUUID: cs.uuid,
          subUUID: c.uuid,
          energy: CardCollection.cards[c.id]?.profile.energy ?? 0
        }))
    )
    .sort((a, b) => a.energy - b.energy);
  return candidates[0] ? { rootUUID: candidates[0].rootUUID, subUUID: candidates[0].subUUID } : undefined;
}

/**
 * Decides the battle the bot declares this turn from its client state: a raid
 * with all mission-ready ships when the bot's fleet clearly exceeds the
 * opponent's orbital defense, otherwise a mission with the fastest
 * mission-ready ships when the fleet is at least as strong as the opponent's
 * total fleet and those fastest ships are at least as strong as the opponent
 * ships in the orbital zone fast enough to intercept them, otherwise no battle.
 */
export function planBattle(state: ClientState): ClientPlannedBattle {
  const missionReadyShips = state.cardStacks.filter(cs => cs.ownedByPlayer && cs.missionReady);
  if (missionReadyShips.length == 0) return { type: BattleType.None, shipIds: [] };
  const opponentShips = state.cardStacks.filter(cs => !cs.ownedByPlayer && isStackOfType(cs, CardType.Hull));
  const ownStrength = fleetStrength(missionReadyShips);
  const opponentOrbitalStrength = fleetStrength(opponentShips.filter(cs => cs.zone == Zone.Orbital));
  if (ownStrength >= opponentOrbitalStrength * raidStrengthFactor) {
    return { type: BattleType.Raid, shipIds: missionReadyShips.map(cs => cs.uuid) };
  }
  if (ownStrength >= fleetStrength(opponentShips)) {
    const maxSpeed = Math.max(...missionReadyShips.map(stackSpeed));
    const fastestShips = missionReadyShips.filter(cs => stackSpeed(cs) == maxSpeed);
    const interceptors = opponentShips.filter(cs => cs.zone == Zone.Orbital && stackSpeed(cs) >= maxSpeed);
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
export function selectInterceptingShips(state: ClientState): string[] {
  if (state.battle.type == BattleType.Mission) {
    const interceptors = state.cardStacks.filter(cs => cs.ownedByPlayer && cs.interceptionReady);
    const ownStrength = fleetStrength(interceptors);
    const attackerShips = state.battle.opponentShipIds
      .map(id => state.cardStacks.find(cs => cs.uuid == id))
      .filter((cs): cs is ClientCardStack => !!cs);
    return ownStrength >= fleetStrength(attackerShips) ? interceptors.map(cs => cs.uuid) : [];
  }
  return state.cardStacks.filter(cs => cs.ownedByPlayer && cs.missionReady).map(cs => cs.uuid);
}

/**
 * Selects the bot's next attack in the combat phase: the first battle-ready
 * weapon against the current focus target. Destroyed hulls are not removed
 * from battle ships until the end of each battle round, so targets are
 * filtered by remaining hit points: a destroyed focus target releases the focus
 * and destroyed hulls cannot be picked as new targets. Returns undefined if the
 * bot cannot attack.
 */
export function selectAttack(state: ClientState, focusTargetUUID?: string): BotAttack | undefined {
  for (const shipUUID of state.battle.playerShipIds) {
    const ship = state.cardStacks.find(cs => cs.uuid == shipUUID);
    const weapon = ship?.cards.find(c => c.battleReady);
    if (ship && weapon) {
      const opponentShips = state.battle.opponentShipIds
        .map(id => state.cardStacks.find(cs => cs.uuid == id))
        .filter((cs): cs is ClientCardStack => !!cs && stackAttribute(cs, 'damage') < stackHp(cs));
      const focusTarget = focusTargetUUID ? opponentShips.find(cs => cs.uuid == focusTargetUUID) : undefined;
      const target = focusTarget ?? (opponentShips.length > 0 ? pickRandom(opponentShips) : undefined);
      return target ? { shipUUID: ship.uuid, weaponUUID: weapon.uuid, targetUUID: target.uuid } : undefined;
    }
  }
  return undefined;
}
