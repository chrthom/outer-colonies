import Match from '../game_state/match';
import { CardType, InterventionType, TurnPhase, Zone } from '../../shared/config/enums';
import ActionPool from '../cards/action_pool';
import { opponentPlayerNo } from '../utils/helpers';
import {
  ClientBattle,
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
import { constants } from '../../shared/config/constants';

export default function toClientState(match: Match, playerNo: number): ClientState {
  const player = match.players[playerNo];
  const opponent = match.players[opponentPlayerNo(playerNo)];
  const toHand: (hand: CardStack[]) => ClientHandCard[] = (hand: CardStack[]) => {
    return hand.map((c, index) => {
      return {
        uuid: c.uuid,
        cardId: c.card.id,
        index: index,
        playable: c.hasValidTargets,
        validTargets: c.validTargets.map(cs => cs.uuid),
        ownedByPlayer: c.player.no == playerNo,
        optionsToChoose: c.card.onEnterGameNumberOfSelectableCardOptions(player),
        options: c.card.onEnterGameSelectableCardOptions(player)
      };
    });
  };
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
  const cardStacks: ClientCardStack[] = [true, false].flatMap(ownedByPlayer => {
    const playerCardStacks = ownedByPlayer ? player.cardStacks : opponent.cardStacks;
    return [Zone.Colony, Zone.Orbital, Zone.Neutral].flatMap(zone => {
      const zoneCardStacks = playerCardStacks.filter(cs => cs.zone == zone);
      return zoneCardStacks.map((cs, index) => {
        const toClientCardStack = (cs: CardStack, index: number) => {
          return {
            uuid: cs.uuid,
            id: cs.card.id,
            index: index,
            battleReady: cs.canAttack,
            retractable: ownedByPlayer && cs.canBeRetracted,
            insufficientEnergy: cs.hasInsufficientEnergy
          };
        };
        const otherCardStacks = cs.cardStacks
          .filter(cs => zone == Zone.Colony || cs.type != CardType.Hull)
          .map(toClientCardStack);
        const hullCardStacks = cs.cardStacks
          .filter(cs => zone != Zone.Colony && cs.type == CardType.Hull)
          .map(cs => toClientCardStack(cs, otherCardStacks.length));
        const cards = otherCardStacks.concat(hullCardStacks);
        const profile = cs.profile;
        const attributes: ClientCardStackAttribute[] = [
          { icon: 'damage', value: cs.damage, warning: true },
          { icon: 'hp', value: profile.hp, warning: cs.damage >= profile.hp }
        ].filter(i => i.value != 0 && i.value < 100);
        if (match.turnPhase == TurnPhase.Build && ownedByPlayer && cs.card.type != CardType.Infrastructure) {
          attributes.push(
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
          );
        } else if (
          match.turnPhase == TurnPhase.Combat &&
          battle.playerShipIds.concat(battle.opponentShipIds).includes(cs.uuid)
        ) {
          attributes.push(
            ...(cs.zone == Zone.Orbital || cs.zone == Zone.Neutral
              ? [{ icon: 'speed', value: profile.speed }]
              : []),
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
        }
        return {
          uuid: cs.uuid,
          cards: cards,
          zone: zone,
          index: index,
          zoneCardsNum: zoneCardStacks.length,
          ownedByPlayer: ownedByPlayer,
          missionReady: ownedByPlayer && cs.isMissionReady,
          interceptionReady: ownedByPlayer && cs.isInterceptionReady,
          attributes: attributes
        };
      });
    });
  });
  const intervention: ClientIntervention | undefined = match.intervention
    ? {
        type: match.intervention.type,
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
