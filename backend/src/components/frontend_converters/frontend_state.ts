import Match from '../game_state/match'
import { BattleType, CardType, TurnPhase, Zone } from '../config/enums'
import ActionPool from '../cards/action_pool';

export class FrontendOpponent {
    name!: string;
    handCardNo!: number;
}

export class FrontendBattle {
    type!: BattleType;
    playerShipIds: string[];
    opponentShipIds: string[];
    priceCards: string[];
    range: number;
}

export class FrontendCardStack {
    uuid!: string;
    cardIds!: number[];
    battleReadyCardIndexes!: number[];
    zone!: Zone;
    index!: number;
    zoneCardsNum!: number;
    ownedByPlayer!: boolean;
    damage!: number;
    criticalDamage!: boolean;
    missionReady!: boolean;
    interventionReady!: boolean;
}

export class FrontendHandCard {
    uuid!: string;
    cardId!: number;
    index!: number;
    playable!: boolean;
    validTargets!: string[];
}

export class FrontendState {
    playerIsActive!: boolean;
    playerPendingAction!: boolean;
    turnPhase!: TurnPhase;
    actionPool: string[];
    opponent!: FrontendOpponent;
    hand!: FrontendHandCard[];
    discardPileIds!: number[];
    cardStacks!: FrontendCardStack[];
    battle?: FrontendBattle;
}

export default function toFrontendState(match: Match, playerNo: number): FrontendState {
    const player = match.players[playerNo];
    const opponent = match.players[match.opponentPlayerNo(playerNo)];
    let hand = player.hand.map((c, index) => {
        return {
            uuid: c.uuid,
            cardId: c.card.id,
            index: index,
            playable: c.isPlayable(),
            validTargets: c.getValidTargets().map(cs => cs.uuid)
        };
    });
    let cardStacks = [true, false].flatMap(ownedByPlayer => {
        const playerCardStacks = ownedByPlayer ? player.cardStacks : opponent.cardStacks;
        return [ Zone.Colony, Zone.Oribital, Zone.Neutral ].flatMap(zone => {
            const zoneCardStacks = playerCardStacks.filter(cs => cs.zone == zone);
            return zoneCardStacks.map((cs, index) => {
                const battleReadyCards = cs.getCardStacks().flatMap((cs, index) => cs.attackAvailable ? [index] : []);
                return {
                    uuid: cs.uuid,
                    cardIds: cs.getCards().map(c => c.id),
                    battleReadyCardIndexes: ownedByPlayer ? battleReadyCards : [],
                    zone: zone,
                    index: index,
                    zoneCardsNum: zoneCardStacks.length,
                    ownedByPlayer: ownedByPlayer,
                    damage: cs.damage,
                    criticalDamage: cs.damage >= cs.profile().hp,
                    missionReady: ownedByPlayer && cs.isMissionReady(),
                    interventionReady: ownedByPlayer
                        && match.getInactivePlayerNo() == playerNo
                        && match.battle.canInterveneMission(playerNo, cs)
                };
            });
        });
    });
    const battle: FrontendBattle = {
        type: match.battle.type,
        playerShipIds: match.battle.ships[playerNo].map(cs => cs.uuid),
        opponentShipIds: match.battle.ships[match.opponentPlayerNo(playerNo)].map(cs => cs.uuid),
        priceCards: match.battle.downsidePriceCards.map(() => 'back')
            .concat(match.battle.upsidePriceCards.map(c => String(c.id))),
        range: match.battle.range
    };
    return {
        playerIsActive: match.activePlayerNo == playerNo,
        playerPendingAction: match.actionPendingByPlayerNo == playerNo,
        turnPhase: match.turnPhase,
        actionPool: player.actionPool.getPool().sort(ActionPool.sortOrder).map(a => a.toString()),
        opponent: {
            name: opponent.name,
            handCardNo: opponent.hand.length
        },
        hand: hand,
        discardPileIds: player.discardPile.map(c => c.id),
        cardStacks: cardStacks,
        battle: battle
    };
}
