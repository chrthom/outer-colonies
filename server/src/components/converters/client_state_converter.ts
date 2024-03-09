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
  ClientPlayer,
  ClientState
} from '../../shared/interfaces/client_state';
import { InterventionAttack } from '../game_state/intervention';
import CardStack from '../cards/card_stack';
import { constants } from '../../shared/config/constants';

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
    });
  };
  const player = match.players[playerNo];
  const opponent = match.players[opponentPlayerNo(playerNo)];
  const cardStacks: ClientCardStack[] = [true, false].flatMap(ownedByPlayer => {
    const playerCardStacks = ownedByPlayer ? player.cardStacks : opponent.cardStacks;
    return [Zone.Colony, Zone.Orbital, Zone.Neutral].flatMap(zone => {
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
  const battle: ClientBattle = {
    type: match.battle.type,
    playerShipIds: match.battle.ships[playerNo].map(cs => cs.uuid),
    opponentShipIds: match.battle.ships[opponentPlayerNo(playerNo)].map(cs => cs.uuid),
    priceCardIds: match.battle.downsidePriceCards
      .map(() => constants.cardBackSideID)
      .concat(match.battle.upsidePriceCards.map(c => c.id)),
    range: match.battle.range,
    recentAttack: match.battle.recentAttack
  };
  const intervention: ClientIntervention | undefined = match.intervention
    ? {
        type: match.intervention.type,
        attack:
          match.intervention.type == InterventionType.Attack
            ? {
                sourceUUID: (<InterventionAttack>match.intervention).src.rootCardStack.uuid,
                sourceIndex: (<InterventionAttack>match.intervention).src.rootCardStack.cardStacks.findIndex(
                  cs => cs.uuid == (<InterventionAttack>match.intervention).src.uuid
                ),
                targetUUID: (<InterventionAttack>match.intervention).target.uuid
              }
            : undefined
      }
    : undefined;
  const players: ClientPlayer[] = [player, opponent].map(p => {
    const actionPool = p.actionPool.pool
      .filter(a => a.possibleCardTypes[0] != CardType.Orb)
      .sort(ActionPool.sortOrder)
      .map(a => a.toString());
    const hasToRetractCards = cardStacks
      .filter(cs => cs.ownedByPlayer === (p.no == playerNo))
      .flatMap(cs => cs.cards)
      .some(c => c.insufficientEnergy);
    return {
      actionPool: actionPool,
      deckSize: p.deck.length,
      discardPileIds: p.discardPile.map(c => c.id),
      hand: toHand(p.hand),
      handCardLimit: p.handCardLimit,
      hasToRetractCards: hasToRetractCards,
      name: p.name
    };
  });
  const gameResult: ClientGameResult | undefined = match.gameResult.gameOver
    ? {
        won: match.gameResult.winnerNo == player.no,
        type: match.gameResult.type,
        sol: match.gameResult.winnerNo == player.no ? match.gameResult.winnerSol : match.gameResult.loserSol
      }
    : undefined;
  return {
    battle: battle,
    cardStacks: cardStacks,
    gameResult: gameResult,
    highlightCardUUID: match.highlightCard?.uuid,
    intervention: intervention,
    opponent: players[1],
    player: players[0],
    playerIsActive: match.activePlayerNo == playerNo,
    playerPendingAction: match.pendingActionPlayerNo == playerNo,
    turnPhase: match.turnPhase
  };
}
