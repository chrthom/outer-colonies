import Match from '../game_state/match'
import { BattleType, CardType, TurnPhase, Zone } from '../config/enums'
import { consts } from '../config/consts';
import Battle from '../game_state/battle';

export class FrontendOpponent {
    name!: string;
    handCardNo!: number;
}

export class FrontendActions {
    hull!: number;
    equipment!: number;
    colony!: number;
    tactic!: number;
    orb!: number;
}

export class FrontendBattle {
    type!: BattleType;
    playerShipIds: Array<string>;
    opponentShipIds: Array<string>;
    priceCards: Array<string>;
}

export class FrontendCardStack {
    uuid!: string;
    cardIds!: Array<string>;
    zone!: Zone;
    index!: number;
    zoneCardsNum!: number;
    ownedByPlayer!: boolean;
    damage!: number;
    missionReady!: boolean;
}

export class FrontendHandCard {
    uuid!: string;
    cardId!: string;
    index!: number;
    playable!: boolean;
    validTargets!: Array<string>;
}

export class FrontendState {
    playerIsActive!: boolean;
    playerPendingAction!: boolean;
    turnPhase!: TurnPhase;
    remainingActions: FrontendActions;
    opponent!: FrontendOpponent;
    hand!: Array<FrontendHandCard>;
    cardStacks!: Array<FrontendCardStack>;
    battle?: FrontendBattle;
}

export default function toFrontendState(match: Match, playerNo: number): FrontendState {
    const player = match.players[playerNo];
    const opponent = match.players[match.opponentPlayerNo(playerNo)];
    let hand = player.hand.map((c, index) => {
        let validTargets = c.card.canBeAttachedTo(player.cardStacks).map(cs => cs.uuid);
        if (c.card.canBeAttachedToColony(player.cardStacks)) validTargets.push(consts.colonyPlayer); // TODO: Implement opponent colony
        return {
            uuid: c.uuid,
            cardId: String(c.card.id),
            index: index,
            playable: c.card.isPlayable(match, playerNo),
            validTargets: validTargets
        };
    });
    let cardStacks = [true, false].flatMap(ownedByPlayer => {
        const playerCardStacks = ownedByPlayer ? player.cardStacks : opponent.cardStacks;
        return [Zone.Colony, Zone.Oribital, Zone.Neutral].flatMap(zone => {
            const zoneCardStacks = playerCardStacks.filter(cs => cs.zone == zone);
            const colonyPlaceholder: Array<FrontendCardStack> = zone != Zone.Colony ? [] : [
                {
                    uuid: ownedByPlayer ? consts.colonyPlayer : consts.colonyOpponent,
                    cardIds: [ 'colony' ],
                    zone: Zone.Colony,
                    index: 0,
                    zoneCardsNum: zoneCardStacks.length + 1,
                    ownedByPlayer: ownedByPlayer,
                    damage: 0, // TODO: Implement once needed
                    missionReady: false
                }
            ];
            return zoneCardStacks.map((cs, index) => {
                return {
                    uuid: cs.uuid,
                    cardIds: cs.getCards().map(c => String(c.id)),
                    zone: zone,
                    index: index + colonyPlaceholder.length,
                    zoneCardsNum: zoneCardStacks.length + colonyPlaceholder.length,
                    ownedByPlayer: ownedByPlayer,
                    damage: 0, // TODO: Implement once needed
                    missionReady: cs.isMissionReady() && ownedByPlayer
                };
            }).concat(colonyPlaceholder);
        });
    });
    const battle: FrontendBattle = {
        type: match.battle.type,
        playerShipIds: (match.activePlayerNo == playerNo ? match.battle.missionShips : match.battle.interveneShips)
            .map(cs => cs.uuid),
        opponentShipIds: (match.activePlayerNo != playerNo ? match.battle.missionShips : match.battle.interveneShips)
            .map(cs => cs.uuid),
        priceCards: match.battle.downsidePriceCards.map(() => 'back')
            .concat(match.battle.upsidePriceCards.map(c => String(c.id)))
    };
    return {
        playerIsActive: match.activePlayerNo == playerNo,
        playerPendingAction: match.actionPendingByPlayerNo == playerNo,
        turnPhase: match.turnPhase,
        remainingActions: {
            hull: player.remainingActions[CardType.Hull],
            equipment: player.remainingActions[CardType.Equipment],
            colony: player.remainingActions[CardType.Colony],
            tactic: player.remainingActions[CardType.Tactic],
            orb: player.remainingActions[CardType.Orb]
        },
        opponent: {
            name: opponent.name,
            handCardNo: opponent.hand.length
        },
        hand: hand,
        cardStacks: cardStacks,
        battle: battle
    };
}
