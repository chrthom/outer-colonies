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
        y: new CardYPosition(400)
      });
      const [firstRotationTween, firstPositionTween] = tweens;

      card.tween({
        duration: animationConfig.duration.move,
        x: new CardXPosition(500),
        y: new CardYPosition(600)
      });

      expect(firstRotationTween.stop).toHaveBeenCalledTimes(1);
      expect(firstPositionTween.stop).toHaveBeenCalledTimes(1);
      expect(tweens.length).toBe(4);
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
        y: new CardYPosition(400)
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
  });

  describe('destroy', () => {
    it('stops active position and rotation tweens before destroying planes', () => {
      const { card, tweens } = makeCardImage();

      card.tween({
        duration: animationConfig.duration.move,
        x: new CardXPosition(300),
        y: new CardYPosition(400)
      });
      const [rotationTween, positionTween] = tweens;

      card.destroy();

      expect(rotationTween.stop).toHaveBeenCalledTimes(1);
      expect(positionTween.stop).toHaveBeenCalledTimes(1);
    });
  });
});
