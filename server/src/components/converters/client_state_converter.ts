import Match from '../game_state/match';
import { CardType, InterventionType, Zone } from '../../shared/config/enums';
import ActionPool from '../cards/action_pool';
import { opponentPlayerNo } from '../utils/helpers';
import {
  ClientBattle,
  ClientCardStack,
  ClientDefenseIcon,
  ClientGameResult,
  ClientHandCard,
  ClientIntervention,
  ClientOpponent,
  ClientState
} from '../../shared/interfaces/client_state';
import { InterventionAttack } from '../game_state/intervention';
import CardStack from '../cards/card_stack';

export default function toClientState(match: Match, playerNo: number): ClientState {
  const toHand: (hand: CardStack[]) => ClientHandCard[] = (hand: CardStack[]) => {
    return hand.map((c, index) => {
      return {
        uuid: c.uuid,
        cardId: c.card.id,
        index: index,
        playable: c.hasValidTargets,
        validTargets: c.validTargets.map(cs => cs.uuid),
        ownedByPlayer: c.player.no == playerNo
      };
    }, this);
  };
  const player = match.players[playerNo];
  const opponent = match.players[opponentPlayerNo(playerNo)];
  const cardStacks: ClientCardStack[] = [true, false].flatMap(ownedByPlayer => {
    const playerCardStacks = ownedByPlayer ? player.cardStacks : opponent.cardStacks;
    return [Zone.Colony, Zone.Oribital, Zone.Neutral].flatMap(zone => {
      const zoneCardStacks = playerCardStacks.filter(cs => cs.zone == zone);
      return zoneCardStacks.map((cs, index) => {
        const interceptionReady =
          ownedByPlayer &&
          match.inactivePlayerNo == playerNo &&
          match.battle.canInterceptMission(playerNo, cs);
        const defenseIcons: ClientDefenseIcon[] = cs.cardStacks
          .filter(c => c.card.canDefend)
          .map(c => {
            let icon: string;
            if (c.profile.armour > 0) icon = `armour_${c.profile.armour}`;
            else if (c.profile.shield > 0) icon = `shield_${c.profile.shield}`;
            else icon = `point_defense_${c.profile.pointDefense}`;
            return {
              icon: icon,
              depleted: !c.defenseAvailable
            };
          })
          .sort();
        const cards = cs.cardStacks.map((cs, index) => {
          return {
            id: cs.card.id,
            index: index,
            battleReady: cs.canAttack,
            retractable: ownedByPlayer && cs.canBeRetracted,
            insufficientEnergy: cs.hasInsufficientEnergy
          };
        });
        return {
          uuid: cs.uuid,
          cards: cards,
          zone: zone,
          index: index,
          zoneCardsNum: zoneCardStacks.length,
          ownedByPlayer: ownedByPlayer,
          damage: cs.damage,
          criticalDamage: cs.damage >= cs.profile.hp,
          missionReady: ownedByPlayer && cs.isMissionReady,
          interceptionReady: interceptionReady,
          defenseIcons: defenseIcons
        };
      });
    });
  });
  const actionPool = player.actionPool.pool
    .filter(a => a.possibleCardTypes[0] != CardType.Orb)
    .sort(ActionPool.sortOrder)
    .map(a => a.toString());
  const battle: ClientBattle = {
    type: match.battle.type,
    playerShipIds: match.battle.ships[playerNo].map(cs => cs.uuid),
    opponentShipIds: match.battle.ships[opponentPlayerNo(playerNo)].map(cs => cs.uuid),
    priceCardIds: match.battle.downsidePriceCards
      .map(() => 1)
      .concat(match.battle.upsidePriceCards.map(c => c.id)),
    range: match.battle.range,
    recentAttack: match.battle.recentAttack
  };
  const intervention: ClientIntervention = match.intervention
    ? {
        type: match.intervention.type,
        attack:
          match.intervention.type == InterventionType.Attack
            ? {
                sourceUUID: (match.intervention as InterventionAttack).src.rootCardStack.uuid,
                sourceIndex: (
                  match.intervention as InterventionAttack
                ).src.rootCardStack.cardStacks.findIndex(
                  cs => cs.uuid == (match.intervention as InterventionAttack).src.uuid
                ),
                targetUUID: (match.intervention as InterventionAttack).target.uuid
              }
            : undefined
      }
    : undefined;
  const opponentData: ClientOpponent = {
    name: opponent.name,
    hand: toHand(opponent.hand),
    handCardSize: opponent.hand.length,
    deckSize: opponent.deck.length,
    discardPileIds: opponent.discardPile.map(c => c.id)
  };
  const gameResult: ClientGameResult = match.gameResult.gameOver
    ? {
        won: match.gameResult.winnerNo == player.no,
        type: match.gameResult.type,
        sol: match.gameResult.winnerNo == player.no ? match.gameResult.winnerSol : match.gameResult.loserSol
      }
    : undefined;
  return {
    playerIsActive: match.activePlayerNo == playerNo,
    playerPendingAction: match.pendingActionPlayerNo == playerNo,
    turnPhase: match.turnPhase,
    actionPool: actionPool,
    opponent: opponentData,
    hand: toHand(player.hand),
    handCardLimit: player.handCardLimit,
    deckSize: player.deck.length,
    discardPileIds: player.discardPile.map(c => c.id),
    cardStacks: cardStacks,
    battle: battle,
    intervention: intervention,
    gameResult: gameResult,
    hasToRetractCards: cardStacks.flatMap(cs => cs.cards).some(c => c.insufficientEnergy),
    highlightCardUUID: match.highlightCard?.uuid
  };
}
