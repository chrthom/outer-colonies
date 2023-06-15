import Match from '../game_state/match'
import { EventType, BattleType, CardType, TurnPhase, Zone } from '../config/enums'
import ActionPool from '../cards/action_pool';
import { opponentPlayerNo } from '../utils/utils';

export class FrontendOpponent {
    name!: string;
    handCardNo!: number;
}

export class FrontendBattle {
    type!: BattleType;
    playerShipIds: string[];
    opponentShipIds: string[];
    priceCardIds: number[];
    range: number;
}

export class FrontendCard {
    id!: number;
    index!: number;
    battleReady!: boolean;
    retractable!: boolean;
    insufficientEnergy!: boolean;
}

export class FrontendCardStack {
    uuid!: string;
    cards!: FrontendCard[];
    zone!: Zone;
    index!: number;
    zoneCardsNum!: number;
    ownedByPlayer!: boolean;
    damage!: number;
    criticalDamage!: boolean;
    missionReady!: boolean;
    interventionReady!: boolean;
    defenseIcons!: FrontendDefenseIcon[];
}

export class FrontendDefenseIcon {
    icon!: string;
    depleted!: boolean;
}

export class FrontendHandCard {
    uuid!: string;
    cardId!: number;
    index!: number;
    playable!: boolean;
    validTargets!: string[];
}

export class FrontendEvent {
    type: EventType;
    playerEvent: boolean;
    oldUUID?: string;
    newUUID?: string;
    target?: string;
}

export class FrontendGameResult {
    won: boolean;
}

export class FrontendState {
    playerIsActive!: boolean;
    playerPendingAction!: boolean;
    turnPhase!: TurnPhase;
    actionPool: string[];
    opponent!: FrontendOpponent;
    hand!: FrontendHandCard[];
    handCardLimit!: number;
    deckSize!: number;
    discardPileIds!: number[];
    cardStacks!: FrontendCardStack[];
    battle?: FrontendBattle;
    gameResult?: FrontendGameResult;
    hasToRetractCards: boolean;
    events: FrontendEvent[];
}

export default function toFrontendState(match: Match, playerNo: number): FrontendState {
    const player = match.players[playerNo];
    const opponent = match.players[opponentPlayerNo(playerNo)];
    const hand: FrontendHandCard[] = player.hand.map((c, index) => {
        return {
            uuid: c.uuid,
            cardId: c.card.id,
            index: index,
            playable: c.isPlayable(),
            validTargets: c.getValidTargets().map(cs => cs.uuid)
        };
    });
    const cardStacks: FrontendCardStack[] = [true, false].flatMap(ownedByPlayer => {
        const playerCardStacks = ownedByPlayer ? player.cardStacks : opponent.cardStacks;
        return [ Zone.Colony, Zone.Oribital, Zone.Neutral ].flatMap(zone => {
            const zoneCardStacks = playerCardStacks.filter(cs => cs.zone == zone);
            return zoneCardStacks.map((cs, index) => {
                const interventionReady = ownedByPlayer
                    && match.getInactivePlayerNo() == playerNo
                    && match.battle.canInterveneMission(playerNo, cs);
                const defenseIcons: FrontendDefenseIcon[] = cs.getCardStacks()
                    .filter(c => c.card.canDefend())
                    .map(c => {
                        let icon: string;
                        if (c.profile().armour > 0) icon = `armour_${c.profile().armour}`;
                        else if (c.profile().shield > 0) icon = `shield_${c.profile().shield}`;
                        else icon = `point_defense_${c.profile().pointDefense}`;
                        return {
                            icon: icon,
                            depleted: !c.defenseAvailable
                        };
                    })
                    .sort();
                const cards = cs.getCardStacks().map((cs, index) => {
                    return {
                        id: cs.card.id,
                        index: index,
                        battleReady: cs.canAttack(player),
                        retractable: ownedByPlayer && cs.canBeRetracted(),
                        insufficientEnergy: cs.hasInsufficientEnergy()
                    }
                });
                return {
                    uuid: cs.uuid,
                    cards: cards,
                    zone: zone,
                    index: index,
                    zoneCardsNum: zoneCardStacks.length,
                    ownedByPlayer: ownedByPlayer,
                    damage: cs.damage,
                    criticalDamage: cs.damage >= cs.profile().hp,
                    missionReady: ownedByPlayer && cs.isMissionReady(),
                    interventionReady: interventionReady,
                    defenseIcons: defenseIcons
                };
            });
        });
    });
    const actionPool = player.actionPool.getPool()
        .filter(a => a.possibleCardTypes[0] != CardType.Orb)
        .sort(ActionPool.sortOrder)
        .map(a => a.toString());
    const battle: FrontendBattle = {
        type: match.battle.type,
        playerShipIds: match.battle.ships[playerNo].map(cs => cs.uuid),
        opponentShipIds: match.battle.ships[opponentPlayerNo(playerNo)].map(cs => cs.uuid),
        priceCardIds: match.battle.downsidePriceCards.map(() => 1)
            .concat(match.battle.upsidePriceCards.map(c => c.id)),
        range: match.battle.range
    };
    const events: FrontendEvent[] = match.eventBuffer.map(e => {
        return {
            type: e.type,
            playerEvent: e.player.no == playerNo,
            oldUUID: e.oldUUID,
            newUUID: e.newUUID,
            target: e.target
        };
    });
    const gameResult = match.gameResult.gameOver ? {
        won: match.gameResult.winnerNo == player.no
    } : null;
    return {
        playerIsActive: match.activePlayerNo == playerNo,
        playerPendingAction: match.actionPendingByPlayerNo == playerNo,
        turnPhase: match.turnPhase,
        actionPool: actionPool,
        opponent: {
            name: opponent.name,
            handCardNo: opponent.hand.length
        },
        hand: hand,
        handCardLimit: player.handCardLimit(),
        deckSize: player.deck.length,
        discardPileIds: player.discardPile.map(c => c.id),
        cardStacks: cardStacks,
        battle: battle,
        gameResult: gameResult,
        hasToRetractCards: cardStacks.flatMap(cs => cs.cards).some(c => c.insufficientEnergy),
        events: events
    };
}
