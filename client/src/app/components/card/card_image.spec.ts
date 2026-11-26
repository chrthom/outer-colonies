import CardImage from './card_image';
import { CardXPosition, CardYPosition } from '../perspective';
import { animationConfig } from '../../config/animation';
import { layoutConfig } from '../../config/layout';
import { asGameScene, makeGameObjectStub, makeSceneStub, SceneStub } from '../../testing/phaser_stubs';

function makePlaneStub() {
  return Object.assign(makeGameObjectStub(), {
    createBitmapMask: jasmine.createSpy('createBitmapMask').and.returnValue({}),
    modelPosition: { x: 0, y: 0, z: 0 },
    modelRotation: { x: 0, y: 0, z: 0 }
  });
}

function makeTweenStub() {
  return { stop: jasmine.createSpy('tween.stop') };
}

function makeCardImage(sceneOverrides: Partial<SceneStub> = {}): {
  card: CardImage;
  scene: SceneStub;
  tweens: Array<{ stop: jasmine.Spy }>;
} {
  const tweens: Array<{ stop: jasmine.Spy }> = [];
  const scene = makeSceneStub(sceneOverrides);
  scene.add.plane.and.callFake(makePlaneStub);
  scene.tweens.add.and.callFake(() => {
    const tween = makeTweenStub();
    tweens.push(tween);
    return tween;
  });
  const card = new CardImage(asGameScene(scene), new CardXPosition(100), new CardYPosition(200), 1);
  return { card, scene, tweens };
}

describe('CardImage', () => {
  describe('tween', () => {
    it('stops active position and rotation tweens before starting new ones', () => {
      const { card, tweens } = makeCardImage();

      card.tween({
        duration: animationConfig.duration.move,
        x: new CardXPosition(300),
        y: new CardYPosition(400),
        xRotation: layoutConfig.game.cards.perspective.board,
        angle: 0
      });
      const [firstRotationTween, firstPositionTween] = tweens;

      card.tween({
        duration: animationConfig.duration.move,
        x: new CardXPosition(500),
        y: new CardYPosition(600),
        xRotation: layoutConfig.game.cards.perspective.neutral,
        angle: 10
      });

      expect(firstRotationTween.stop).toHaveBeenCalledTimes(1);
      expect(firstPositionTween.stop).toHaveBeenCalledTimes(1);
      expect(tweens.length).toBe(4);
    });

    it('keeps an active rotation tween running when a position-only tween starts', () => {
      const { card, tweens } = makeCardImage();

      // Simulate HandCard.update() starting both draw position and rotation tweens
      card.tween({
        duration: animationConfig.duration.draw,
        x: new CardXPosition(300),
        y: new CardYPosition(400),
        xRotation: layoutConfig.game.cards.perspective.neutral,
        angle: -5
      });
      const [drawRotationTween, drawPositionTween] = tweens;

      // Simulate hover expand calling tween() with position only
      card.tween({
        duration: animationConfig.duration.handExpand,
        x: new CardXPosition(300),
        y: new CardYPosition(335)
      });

      expect(drawRotationTween.stop).not.toHaveBeenCalled();
      expect(drawPositionTween.stop).toHaveBeenCalledTimes(1);
      expect(tweens.length).toBe(3);
    });
  });

  describe('discard', () => {
    it('disables interactivity, stops active tweens, and animates to the deck when retracted', () => {
      const { card, scene, tweens } = makeCardImage();
      const imageStub = card.image as unknown as { disableInteractive: jasmine.Spy };

      // Simulate an in-flight expand tween running before retract/discard begins
      card.tween({
        duration: animationConfig.duration.move,
        x: new CardXPosition(300),
        y: new CardYPosition(400),
        xRotation: layoutConfig.game.cards.perspective.neutral,
        angle: 4
      });
      const [expandRotationTween, expandPositionTween] = tweens;

      card.discard(true);

      expect(imageStub.disableInteractive).toHaveBeenCalledWith(true);
      expect(expandRotationTween.stop).toHaveBeenCalledTimes(1);
      expect(expandPositionTween.stop).toHaveBeenCalledTimes(1);
      expect(scene.tweens.add).toHaveBeenCalledTimes(4);
      const positionTweenConfig = scene.tweens.add.calls.mostRecent().args[0] as { x: number; y: number };
      expect(positionTweenConfig.x).toBe(layoutConfig.game.cards.placement.player.deck.x.value3d);
      expect(positionTweenConfig.y).toBe(layoutConfig.game.cards.placement.player.deck.y.value3d);
    });

    it('ignores subsequent tween calls so an un-expand tween cannot overwrite a retract animation', () => {
      const { card, scene, tweens } = makeCardImage();

      card.discard(true);
      const [discardRotationTween, discardPositionTween] = tweens;

      card.tween({
        duration: animationConfig.duration.move,
        x: new CardXPosition(999),
        y: new CardYPosition(999)
      });

      expect(discardRotationTween.stop).not.toHaveBeenCalled();
      expect(discardPositionTween.stop).not.toHaveBeenCalled();
      expect(scene.tweens.add).toHaveBeenCalledTimes(2);
    });

    it('routes an opponent-hosted attachment to the local player discard pile when targetOwnedByPlayer is true', () => {
      const playerDiscardUpdate = jasmine.createSpy('playerDiscard.update');
      const opponentDiscardUpdate = jasmine.createSpy('opponentDiscard.update');
      const scene = makeSceneStub();
      scene.state!.player.discardPileIds = [442];
      scene.state!.opponent.discardPileIds = [99];
      scene.getPlayerUI.and.callFake((isPlayer: boolean) => ({
        hand: [],
        discardPile: { update: isPlayer ? playerDiscardUpdate : opponentDiscardUpdate }
      }));
      scene.add.plane.and.callFake(makePlaneStub);
      scene.tweens.add.and.callFake(() => makeTweenStub());
      const card = new CardImage(asGameScene(scene), new CardXPosition(100), new CardYPosition(200), 442, {
        isOpponentCard: true
      });

      card.discard(false, true);

      const [rotationConfig, positionConfig] = scene.tweens.add.calls
        .allArgs()
        .map(args => args[0]) as Array<{
        x?: number;
        y?: number;
        z?: number;
        onComplete?: () => void;
      }>;
      expect(positionConfig.x).toBe(layoutConfig.game.cards.placement.player.discardPile.x.value3d);
      expect(positionConfig.y).toBe(layoutConfig.game.cards.placement.player.discardPile.y.value3d);
      expect(rotationConfig.z).toBeCloseTo(0, 5);
      positionConfig.onComplete!();
      expect(playerDiscardUpdate).toHaveBeenCalledWith([442]);
      expect(opponentDiscardUpdate).not.toHaveBeenCalled();
    });
  });

  describe('enableMaximizeOnRightclick', () => {
    it('bridges right-click, pointermove, and pointerout to GameInteractionService', () => {
      const { card, scene } = makeCardImage();
      spyOn(scene.interaction, 'toggleZoomCard');
      spyOn(scene.interaction, 'updateZoomCardPosition');
      spyOn(scene.interaction, 'hideZoomCard');

      card.enableMaximizeOnRightclick();

      const handlers = new Map<string, (pointer: unknown) => void>();
      (card.image.on as unknown as jasmine.Spy).calls.allArgs().forEach(([event, handler]) => {
        handlers.set(event as string, handler as (pointer: unknown) => void);
      });

      handlers.get('pointerdown')!({
        rightButtonDown: () => true,
        x: layoutConfig.scene.width / 2,
        y: layoutConfig.scene.height / 4
      });
      expect(scene.interaction.toggleZoomCard).toHaveBeenCalledWith(1, 50, 25);

      handlers.get('pointermove')!({
        x: (layoutConfig.scene.width * 3) / 4,
        y: layoutConfig.scene.height / 2
      });
      expect(scene.interaction.updateZoomCardPosition).toHaveBeenCalledWith(75, 50);

      handlers.get('pointerout')!(undefined);
      expect(scene.interaction.hideZoomCard).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('stops active position and rotation tweens before destroying planes', () => {
      const { card, tweens } = makeCardImage();

      card.tween({
        duration: animationConfig.duration.move,
        x: new CardXPosition(300),
        y: new CardYPosition(400),
        xRotation: layoutConfig.game.cards.perspective.board,
        angle: 0
      });
      const [rotationTween, positionTween] = tweens;

      card.destroy();

      expect(rotationTween.stop).toHaveBeenCalledTimes(1);
      expect(positionTween.stop).toHaveBeenCalledTimes(1);
    });
  });
});
