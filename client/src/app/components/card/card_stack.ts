import { layoutConfig } from '../../config/layout';
import { CardPosition } from '../../config/layout_game';
import Game from '../../scenes/game';
import { BattleType, MsgTypeInbound, TurnPhase, Zone } from '../../../../../server/src/shared/config/enums';
import {
  ClientAttack,
  ClientCard,
  ClientCardStack
} from '../../../../../server/src/shared/interfaces/client_state';
import ValueIndicator from '../indicators/value_indicator';
import DefenseIndicator from '../indicators/defense_indicator';
import Card from './card';
import { animationConfig } from '../../config/animation';
import AttackDamageIndicator from '../indicators/attack_damage_indicator';
import CardImage from './card_image';
import { constants } from '../../../../../server/src/shared/config/constants';
import { CardXPosition, CardYPosition } from '../perspective';

export default class CardStack {
  cards!: Array<Card>;
  uuid: string;
  data: ClientCardStack;
  damageIndicator?: ValueIndicator;
  defenseIndicator?: DefenseIndicator;
  private scene!: Game;
  constructor(scene: Game, data: ClientCardStack, origin?: CardImage) {
    this.scene = scene;
    this.uuid = data.uuid;
    this.data = data;
    this.createCards(true, origin);
    this.tween();
  }
  discard(toDeck?: boolean) {
    this.destroyIndicators();
    this.cards.forEach(c => c.discard(toDeck));
  }
  update(data: ClientCardStack) {
    this.destroyIndicators();
    const [removedCardIds, newCardIds] = this.arrayDiff(
      this.cards.map(c => c.cardId),
      data.cards.map(c => c.id)
    );
    this.filterCardsByIdList(data.cards.map(c => c.id)).forEach(c => c.destroy());
    this.filterCardsByIdList(removedCardIds).forEach(c => {
      let toDeck = false;
      if (this.scene.getPlayerState(this.ownedByPlayer).discardPileIds.slice(-1).pop() != c.cardId) {
        toDeck = true;
        this.scene.retractCardsExist = true;
      }
      c.discard(toDeck);
    }, this);
    this.data.cards = data.cards;
    this.data.criticalDamage = data.criticalDamage;
    this.data.damage = data.damage;
    this.data.defenseIcons = data.defenseIcons;
    this.createCards();
    this.data = data;
    this.filterCardsByIdList(newCardIds).forEach(c => {
      const handCard = this.scene.getPlayerUI(this.ownedByPlayer).hand.find(h => h.data.cardId == c.cardId);
      const x = handCard ? handCard.x : c.placementConfig.deck.x;
      const y = handCard ? handCard.y : c.placementConfig.deck.y;
      const angle = handCard ? handCard.image.angle : this.ownedByPlayer ? 0 : 180;
      c.setX(x).setY(y).setAngle(angle);
    });
    this.tween();
  }
  animateAttack(cardIndex: number) {
    this.cards[cardIndex].animateAttack();
  }
  animateDamage(attack: ClientAttack) {
    new AttackDamageIndicator(this.scene, this, attack);
  }
  highlightDisabled() {
    this.cards.forEach(c => {
      c.highlightDisabled();
    });
  }
  highlightSelectable() {
    this.cards.forEach(c => c.highlightSelectable());
  }
  highlightSelected() {
    this.cards.forEach(c => c.highlightSelected());
  }
  highlightReset() {
    this.cards.forEach(c => {
      c.highlightReset();
    });
  }
  get ownedByPlayer() {
    return this.data.ownedByPlayer;
  }
  get isOpponentColony(): boolean {
    return !this.ownedByPlayer && this.data.cards.slice(-1).pop()?.id == constants.colonyID;
  }
  private filterCardsByIdList(list: number[]) {
    const l = list.slice();
    return this.cards.filter(c => {
      if (l.includes(c.cardId)) {
        l.splice(l.indexOf(c.cardId), 1);
        return true;
      } else {
        return false;
      }
    });
  }
  private tween() {
    this.cards.forEach((c, index) => {
      c.tween({
        duration: animationConfig.duration.move,
        x: this.x,
        y: this.y(index),
        angle: c.shortestAngle(this.ownedByPlayer ? 0 : 180)
      });
    });
    this.damageIndicator?.tween(this.x.value2d, this.zoneLayout.y.value2d);
    this.defenseIndicator?.tween(this.x.value2d, this.zoneLayout.y.value2d);
  }
  private createCards(fromHand?: boolean, origin?: CardImage) {
    this.cards = this.data.cards.map(
      c => new Card(this.scene, this.x, this.y(c.index), !this.ownedByPlayer, this.uuid, c)
    );
    this.cards.forEach(c => {
      c.image.on('pointerdown', () => this.onClickAction(c.data));
      c.enableMaximizeOnMouseover();
    });
    if (this.data.damage > 0) {
      this.damageIndicator = new ValueIndicator(
        this.scene,
        String(this.data.damage),
        this.data.criticalDamage,
        this.x.value2d,
        this.zoneLayout.y.value2d,
        this.ownedByPlayer,
        false
      );
    }
    if (
      this.scene.state.turnPhase == TurnPhase.Combat &&
      this.scene.state.battle?.playerShipIds
        .concat(this.scene.state.battle.opponentShipIds)
        .includes(this.uuid)
    ) {
      this.defenseIndicator = new DefenseIndicator(
        this.scene,
        this.data.defenseIcons,
        this.x.value2d,
        this.zoneLayout.y.value2d,
        this.ownedByPlayer
      );
    }
    if (fromHand && origin) {
        this.cards[0]
          .setX(origin.x)
          .setY(origin.y)
          .setZ(origin.z)
          .setAngle(origin.angle)
          .setXRotation(origin.xRotation);
    }
  }
  private get x(): CardXPosition {
    let zoneWidth =
      this.data.zone == Zone.Neutral
        ? layoutConfig.game.cards.placement.halfZoneWidth
        : layoutConfig.game.cards.placement.zoneWidth;
    let shrinkZone = layoutConfig.game.ui.zones.offset.xTop + layoutConfig.game.ui.zones.offset.xBottom;
    if (this.data.zone == Zone.Colony && this.ownedByPlayer) shrinkZone *= 0;
    else if (this.data.zone == Zone.Neutral) shrinkZone *= 2;
    else if (this.data.zone == Zone.Orbital && !this.ownedByPlayer) shrinkZone *= 3;
    else if (this.data.zone == Zone.Colony) shrinkZone *= 4;
    zoneWidth -= shrinkZone * 2;
    let x = zoneWidth;
    if (this.data.zoneCardsNum <= 2) x /= 2;
    if (this.data.zoneCardsNum == 2) x += zoneWidth / 4 - (this.data.index * zoneWidth) / 2;
    else if (this.data.zoneCardsNum > 2) x -= (this.data.index * zoneWidth) / (this.data.zoneCardsNum - 1);
    x += shrinkZone;
    return this.zoneLayout.x.plus(x);
  }
  private y(index: number): CardYPosition {
    const yDistance = layoutConfig.game.cards.stackYDistance * (this.ownedByPlayer ? 1 : -1);
    return this.zoneLayout.y.plus(index * yDistance);
  }
  private get zoneLayout(): CardPosition {
    const zoneLayout = this.ownedByPlayer
      ? layoutConfig.game.cards.placement.player
      : layoutConfig.game.cards.placement.opponent;
    if (this.data.zone == Zone.Colony) return zoneLayout.colony;
    else if (this.data.zone == Zone.Orbital) return zoneLayout.orbit;
    else return zoneLayout.neutral;
  }
  private destroyIndicators() {
    if (this.damageIndicator) this.damageIndicator.destroy();
    if (this.defenseIndicator) this.defenseIndicator.destroy();
    this.cards.forEach(c => c.destroyButton());
  }
  private onClickAction(cardData: ClientCard) {
    const state = this.scene.state;
    if (state.playerPendingAction) {
      if (state.intervention) {
        if (this.scene.activeCards.hand) {
          this.scene.socket.emit(MsgTypeInbound.Handcard, this.scene.activeCards.hand, this.uuid);
        }
      } else {
        switch (state.turnPhase) {
          case TurnPhase.Build:
            if (state.playerIsActive) {
              if (this.scene.activeCards.hand) {
                this.scene.socket.emit(MsgTypeInbound.Handcard, this.scene.activeCards.hand, this.uuid);
              } else if (this.isOpponentColony) {
                this.scene.resetView(
                  this.scene.plannedBattle.type == BattleType.Raid ? BattleType.None : BattleType.Raid
                );
              } else if (this.scene.plannedBattle.type != BattleType.None && this.data.missionReady) {
                if (this.scene.plannedBattle.shipIds.includes(this.uuid)) {
                  this.scene.plannedBattle.shipIds = this.scene.plannedBattle.shipIds.filter(
                    id => id != this.uuid
                  );
                } else {
                  this.scene.plannedBattle.shipIds.push(this.uuid);
                }
              }
            } else {
              if (this.data.missionReady) {
                if (this.scene.interceptShipIds.includes(this.uuid)) {
                  this.scene.interceptShipIds = this.scene.interceptShipIds.filter(id => id != this.uuid);
                } else if (this.data.interceptionReady) {
                  this.scene.interceptShipIds.push(this.uuid);
                }
              }
            }
            break;
          case TurnPhase.Combat:
            if (
              this.scene.activeCards.stack == this.uuid &&
              this.scene.activeCards.stackIndex == cardData.index
            ) {
              this.scene.activeCards.stack = undefined;
              this.scene.activeCards.stackIndex = undefined;
              this.scene.activeCards.hand = undefined;
            } else if (cardData.battleReady) {
              this.scene.activeCards.stack = this.uuid;
              this.scene.activeCards.stackIndex = cardData.index;
              this.scene.activeCards.hand = undefined;
            } else if (
              this.scene.activeCards.stack &&
              this.scene.state.battle?.opponentShipIds.includes(this.uuid)
            ) {
              this.scene.socket.emit(
                MsgTypeInbound.Attack,
                this.scene.activeCards.stack,
                this.scene.activeCards.stackIndex,
                this.uuid
              );
            }
            break;
        }
      }
      this.scene.updateView();
    }
  }
  private arrayDiff<T>(array1: T[], array2: T[]): [T[], T[]] {
    const a1 = array1.slice();
    const a2 = array2.slice();
    a1.slice().forEach(v1 => {
      const i1 = a1.indexOf(v1);
      const i2 = a2.indexOf(v1);
      if (i1 >= 0 && i2 >= 0) {
        a1.splice(i1, 1);
        a2.splice(i2, 1);
      }
    });
    return [a1, a2];
  }
}
