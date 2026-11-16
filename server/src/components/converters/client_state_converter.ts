import Match from '../game_state/match';
import { BattleType, CardType, InterventionType, TurnPhase, Zone } from '../../shared/config/enums';
import ActionPool from '../cards/action_pool';
import { opponentPlayerNo } from '../utils/helpers';
import {
  ClientBattle,
  ClientCard,
  ClientCardStack,
  ClientCardStackAttribute,
  ClientGameResult,
  ClientHandCard,
  ClientIntervention,
  ClientPlayer,
  ClientState
} from '../../shared/interfaces/client_state';
import { InterventionAttack } from '../game_state/intervention';
import CardStack from '../cards/card_stack';
import Player from '../game_state/player';
import { rules } from '../../shared/config/rules';

/**
 * Projects the server match state into the client representation of the given player. All
 * attributes are computed from the perspective of that player: owned stacks carry build
 * phase attributes, opponent stacks only what is publicly visible.
 * @param match match to project
 * @param playerNo number of the player the state is emitted to
 * @returns the client state for the given player
 */
export default function toClientState(match: Match, playerNo: number): ClientState {
  const player = match.players[playerNo];
  const opponent = match.players[opponentPlayerNo(playerNo)];
  const battle = toClientBattle(match, playerNo);
  const cardStacks = [
    ...toClientCardStacks(match, player, true, battle),
    ...toClientCardStacks(match, opponent, false, battle)
  ];
  const players = [toClientPlayer(player, player, cardStacks), toClientPlayer(opponent, player, cardStacks)];
  return {
    battle: battle,
    cardStacks: cardStacks,
    gameResult: toClientGameResult(match, playerNo),
    highlightCardUUID: match.highlightCard?.uuid,
    intervention: toClientIntervention(match),
    opponent: players[1],
    player: players[0],
    playerIsActive: match.activePlayerNo == playerNo,
    playerPendingAction: match.pendingActionPlayerNo == playerNo,
    turnPhase: match.turnPhase
  };
}

/**
 * Projects the battle for the given player: the player's ships are listed as own ships, the
 * opponent's as opponent ships.
 */
function toClientBattle(match: Match, playerNo: number): ClientBattle {
  return {
    type: match.battle.type,
    playerShipIds: match.battle.ships[playerNo].map(cs => cs.uuid),
    opponentShipIds: match.battle.ships[opponentPlayerNo(playerNo)].map(cs => cs.uuid),
    range: match.battle.range,
    recentAttack: match.battle.recentAttack
  };
}

/**
 * Projects all card stacks of one match participant, grouped by zone. `ownedByPlayer` marks
 * stacks of the player the state is emitted to and gates the build phase attributes.
 */
function toClientCardStacks(
  match: Match,
  owner: Player,
  ownedByPlayer: boolean,
  battle: ClientBattle
): ClientCardStack[] {
  return [Zone.Colony, Zone.Orbital, Zone.Neutral].flatMap(zone => {
    const zoneCardStacks = owner.cardStacks.filter(cs => cs.zone == zone);
    return zoneCardStacks.map((cs, index) =>
      toClientCardStack(match, cs, zone, index, ownedByPlayer, battle, zoneCardStacks.length)
    );
  });
}

function toClientCardStack(
  match: Match,
  cs: CardStack,
  zone: Zone,
  index: number,
  ownedByPlayer: boolean,
  battle: ClientBattle,
  zoneCardsNum: number
): ClientCardStack {
  return {
    uuid: cs.uuid,
    cards: toClientCards(cs, zone, ownedByPlayer),
    zone: zone,
    index: index,
    zoneCardsNum: zoneCardsNum,
    ownedByPlayer: ownedByPlayer,
    missionReady: ownedByPlayer && cs.isMissionReady,
    interceptionReady: ownedByPlayer && cs.isInterceptionReady,
    attributes: toClientAttributes(match, cs, ownedByPlayer, battle)
  };
}

/**
 * Projects the sub card stacks of a card stack into its cards. Hull cards are listed after all
 * other cards so they render as the ship's hull parts.
 */
function toClientCards(cs: CardStack, zone: Zone, ownedByPlayer: boolean): ClientCard[] {
  const toClientCard = (sub: CardStack, index: number): ClientCard => ({
    uuid: sub.uuid,
    id: sub.card.id,
    index: index,
    battleReady: sub.canAttack,
    retractable: ownedByPlayer && sub.canBeRetracted,
    insufficientEnergy: sub.hasInsufficientEnergy
  });
  const otherCardStacks = cs.cardStacks
    .filter(sub => zone == Zone.Colony || sub.type != CardType.Hull)
    .map(toClientCard);
  const hullCardStacks = cs.cardStacks
    .filter(sub => zone != Zone.Colony && sub.type == CardType.Hull)
    .map(sub => toClientCard(sub, otherCardStacks.length));
  return otherCardStacks.concat(hullCardStacks);
}

/**
 * Projects the visible attributes of a card stack: damage and hit points always, control for
 * colonies, build attributes for the owning player and combat attributes for battle
 * participants.
 */
function toClientAttributes(
  match: Match,
  cs: CardStack,
  ownedByPlayer: boolean,
  battle: ClientBattle
): ClientCardStackAttribute[] {
  const profile = cs.profile;
  const attributes: ClientCardStackAttribute[] = [
    { icon: 'damage', value: cs.damage, warning: true },
    { icon: 'hp', value: profile.hp, warning: cs.damage >= profile.hp }
  ].filter(i => i.value != 0 && i.value < 100);
  if (cs.type == CardType.Colony) {
    attributes.push({
      icon: 'control',
      value: cs.player.control,
      warning: cs.player.control > (rules.controlLimit * 2) / 3
    });
  }
  if (match.turnPhase == TurnPhase.Build && ownedByPlayer && cs.card.type != CardType.Infrastructure) {
    attributes.push(...buildPhaseAttributes(cs));
  } else if (
    match.turnPhase == TurnPhase.Combat &&
    battle.playerShipIds.concat(battle.opponentShipIds).includes(cs.uuid)
  ) {
    attributes.push(...combatPhaseAttributes(cs, battle));
  }
  return attributes;
}

/** Projects the profile attributes shown to the owning player during the build phase. */
function buildPhaseAttributes(cs: CardStack): ClientCardStackAttribute[] {
  const profile = cs.profile;
  return [
    ...(cs.type != CardType.Colony ? [{ icon: 'control', value: profile.control }] : []),
    ...[
      { icon: 'speed', value: profile.speed },
      { icon: 'energy', value: profile.energy, warning: profile.energy < 0 },
      { icon: 'theta', value: profile.theta, warning: profile.theta < 0 },
      { icon: 'xi', value: profile.xi, warning: profile.xi < 0 },
      { icon: 'phi', value: profile.phi, warning: profile.phi < 0 },
      { icon: 'omega', value: profile.omega, warning: profile.omega < 0 },
      { icon: 'delta', value: profile.delta, warning: profile.delta < 0 },
      { icon: 'psi', value: profile.psi, warning: profile.psi < 0 }
    ].filter(i => i.value != 0 && i.value < 100)
  ];
}

/** Projects the attributes of a card stack participating in the current battle. */
function combatPhaseAttributes(cs: CardStack, battle: ClientBattle): ClientCardStackAttribute[] {
  const attributes: ClientCardStackAttribute[] = [];
  if (battle.type == BattleType.Mission) {
    attributes.push({ icon: 'control', value: cs.profile.control });
  }
  if (cs.zone == Zone.Orbital || cs.zone == Zone.Neutral) {
    attributes.push({ icon: 'speed', value: cs.profile.speed });
  }
  attributes.push(
    ...cs.cardStacks
      .filter(c => c.card.canDefend)
      .map(c => {
        let icon: string;
        const profile = c.profile;
        if (profile.armour > 0) icon = 'armour';
        else if (profile.shield > 0) icon = 'shield';
        else icon = 'point_defense';
        return <ClientCardStackAttribute>{
          icon: icon,
          value: Math.max(profile.armour, profile.shield, profile.pointDefense),
          warning: !c.defenseAvailable
        };
      })
      .sort()
  );
  return attributes;
}

/** Projects a player's hand; option pickers are resolved for the player viewing the state. */
function toClientHandCards(hand: CardStack[], viewedBy: Player): ClientHandCard[] {
  return hand.map((c, index) => ({
    uuid: c.uuid,
    cardId: c.card.id,
    index: index,
    playable: c.hasValidTargets,
    validTargets: c.validTargets.map(cs => cs.uuid),
    ownedByPlayer: c.player.no == viewedBy.no,
    optionsToSelect: c.card.onEnterGameNumberOfSelectableCardOptions(viewedBy),
    options: c.card.onEnterGameSelectableCardOptions(viewedBy)
  }));
}

/** Projects a player, including the retract hint derived from the already projected stacks. */
function toClientPlayer(p: Player, viewedBy: Player, cardStacks: ClientCardStack[]): ClientPlayer {
  const actionPool = p.actionPool.pool
    .filter(a => a.possibleCardTypes[0] != CardType.Orb)
    .sort(ActionPool.sortOrder)
    .map(a => a.toString());
  const hasToRetractCards = cardStacks
    .filter(cs => cs.ownedByPlayer === (p.no == viewedBy.no))
    .flatMap(cs => cs.cards)
    .some(c => c.insufficientEnergy);
  return {
    actionPool: actionPool,
    deckSize: p.deck.length,
    discardPileIds: p.discardPile.map(c => c.id),
    hand: toClientHandCards(p.hand, viewedBy),
    handCardLimit: p.handCardLimit,
    hasToRetractCards: hasToRetractCards,
    name: p.name
  };
}

/** Projects the pending intervention, if any, including the attacked stacks of an attack. */
function toClientIntervention(match: Match): ClientIntervention | undefined {
  return match.intervention
    ? {
        type: match.intervention.type,
        rootType: match.intervention.root.type,
        attack:
          match.intervention.type == InterventionType.Attack
            ? {
                sourceRootUUID: (<InterventionAttack>match.intervention).src.rootCardStack.uuid,
                sourceSubUUID: (<InterventionAttack>match.intervention).src.uuid,
                targetUUID: (<InterventionAttack>match.intervention).target.uuid
              }
            : undefined
      }
    : undefined;
}

/** Projects the game result from the perspective of the given player, if the game is over. */
function toClientGameResult(match: Match, playerNo: number): ClientGameResult | undefined {
  return match.gameResult.gameOver
    ? {
        won: match.gameResult.winnerNo == playerNo,
        type: match.gameResult.type,
        sol: match.gameResult.winnerNo == playerNo ? match.gameResult.winnerSol : match.gameResult.loserSol
      }
    : undefined;
}
