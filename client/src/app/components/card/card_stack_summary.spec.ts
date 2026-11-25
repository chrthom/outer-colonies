import CardStackSummary from './card_stack_summary';
import { ClientCardStackAttribute } from '@shared/interfaces/client_state';
import { layoutConfig } from '../../config/layout';
import { designConfig } from '../../config/design';

function makeGameObjectStub(): any {
  const stub: any = {};
  [
    'setOrigin',
    'setDepth',
    'setAlpha',
    'setTexture',
    'setText',
    'setFontSize',
    'setFontFamily',
    'setColor',
    'setAlign',
    'destroy'
  ].forEach(method => (stub[method] = jasmine.createSpy(method).and.returnValue(stub)));
  return stub;
}

function makeScene(): any {
  const scene: any = {
    add: jasmine.createSpyObj('add', ['image', 'text']),
    tweens: jasmine.createSpyObj('tweens', ['add'])
  };
  scene.add.image.and.callFake(makeGameObjectStub);
  scene.add.text.and.callFake(makeGameObjectStub);
  return scene;
}

function makeCardStack(attributes: ClientCardStackAttribute[]): any {
  return {
    data: { attributes },
    targetX: { value2d: 100 },
    targetY: jasmine.createSpy('targetY').and.returnValue({ value2d: 200 }),
    maxIndex: 3
  };
}

const attribute = (icon: string, value: number, warning = false): ClientCardStackAttribute => ({
  icon,
  value,
  warning
});

function tweenConfigs(scene: any): any[] {
  return scene.tweens.add.calls.allArgs().map((args: any[]) => args[0]);
}

describe('CardStackSummary', () => {
  const config = layoutConfig.game.cards.summaryBox;

  it('creates one info box per attribute and fades the new boxes in', () => {
    const scene = makeScene();
    const summary = new CardStackSummary(
      scene,
      makeCardStack([attribute('energy', 5), attribute('attack', 2)])
    );

    expect(scene.add.image).toHaveBeenCalledTimes(4); // one box and one icon per attribute
    expect(scene.add.text).toHaveBeenCalledTimes(2); // one value text per attribute
    expect(scene.add.image.calls.argsFor(0)[2]).toBe('card_stack_info_box_blue');
    expect(scene.add.image.calls.argsFor(1)[2]).toBe('attribute_energy');
    expect(scene.add.text.calls.argsFor(0)[2]).toBe('5');
    expect((summary as any).infoBoxes.length).toBe(2);
    // every object of the new boxes is faded in, not recreated
    expect(scene.tweens.add).toHaveBeenCalledTimes(6);
    tweenConfigs(scene).forEach(tweenConfig => expect(tweenConfig.alpha).toBe(designConfig.alpha.faded));
  });

  it('grows by creating only the new box and reusing the existing ones', () => {
    const scene = makeScene();
    const cardStack = makeCardStack([attribute('energy', 5), attribute('attack', 2)]);
    const summary = new CardStackSummary(scene, cardStack);
    const existingBoxes = [...(summary as any).infoBoxes];

    cardStack.data.attributes = [attribute('energy', 5), attribute('attack', 2), attribute('shield', 1)];
    summary.update();

    const infoBoxes = (summary as any).infoBoxes;
    expect(infoBoxes.length).toBe(3);
    expect(infoBoxes[0]).toBe(existingBoxes[0]);
    expect(infoBoxes[1]).toBe(existingBoxes[1]);
    expect(scene.add.image).toHaveBeenCalledTimes(6); // 4 from before plus box and icon of the new attribute
    expect(scene.add.text).toHaveBeenCalledTimes(3);
  });

  it('shrinks by fading out and destroying surplus boxes while keeping the rest', () => {
    const scene = makeScene();
    const cardStack = makeCardStack([attribute('energy', 5), attribute('attack', 2)]);
    const summary = new CardStackSummary(scene, cardStack);
    const keptBox = (summary as any).infoBoxes[0];
    const surplusBox = (summary as any).infoBoxes[1];

    cardStack.data.attributes = [attribute('energy', 5)];
    summary.update();

    expect((summary as any).infoBoxes.length).toBe(1);
    expect((summary as any).infoBoxes[0]).toBe(keptBox);
    const destroyTweens = tweenConfigs(scene).filter(tweenConfig => tweenConfig.alpha === 0);
    expect(destroyTweens.length).toBe(3); // box, icon and value of the surplus box
    destroyTweens.forEach(tweenConfig => tweenConfig.onComplete());
    expect(surplusBox.box.destroy).toHaveBeenCalled();
    expect(surplusBox.icon.destroy).toHaveBeenCalled();
    expect(surplusBox.value.destroy).toHaveBeenCalled();
    expect(keptBox.box.destroy).not.toHaveBeenCalled();
    expect(scene.add.image).toHaveBeenCalledTimes(4); // nothing recreated
    expect(scene.add.text).toHaveBeenCalledTimes(2);
  });

  it('updates box texture, icon and value in place when an attribute changes', () => {
    const scene = makeScene();
    const cardStack = makeCardStack([attribute('energy', 5)]);
    const summary = new CardStackSummary(scene, cardStack);
    const infoBox = (summary as any).infoBoxes[0];

    cardStack.data.attributes = [attribute('attack', 2, true)];
    summary.update();

    expect((summary as any).infoBoxes[0]).toBe(infoBox); // no recreation
    expect(infoBox.box.setTexture).toHaveBeenCalledWith('card_stack_info_box_red');
    expect(infoBox.icon.setTexture).toHaveBeenCalledWith('attribute_attack');
    expect(infoBox.value.setText).toHaveBeenCalledWith('2');
    expect(scene.add.image).toHaveBeenCalledTimes(2); // only the initial box and icon
    expect(scene.add.text).toHaveBeenCalledTimes(1);
  });

  it('repositions existing boxes when the stack moves', () => {
    const scene = makeScene();
    const cardStack = makeCardStack([attribute('energy', 5)]);
    const summary = new CardStackSummary(scene, cardStack);
    scene.tweens.add.calls.reset();

    cardStack.targetX.value2d = 200;
    summary.update();

    expect(scene.tweens.add).toHaveBeenCalledTimes(3); // box, icon and value of the single attribute
    const [boxTween, iconTween, valueTween] = tweenConfigs(scene);
    const expectedX = 200 - ((config.boxesPerRow - 1) / 2) * config.xStep;
    const expectedY = 200; // stubbed targetY
    expect(boxTween.x).toBe(expectedX);
    expect(boxTween.y).toBe(expectedY);
    expect(iconTween.x).toBe(expectedX - config.xOffset);
    expect(iconTween.y).toBe(expectedY - config.yOffset);
    expect(valueTween.x).toBe(expectedX + config.xOffset);
    expect(valueTween.y).toBe(expectedY + config.yOffset);
  });

  it('clears the info boxes on destroy so a later update recreates them', () => {
    const scene = makeScene();
    const cardStack = makeCardStack([attribute('energy', 5)]);
    const summary = new CardStackSummary(scene, cardStack);

    summary.destroy();

    expect((summary as any).infoBoxes).toEqual([]);

    summary.update();

    expect((summary as any).infoBoxes.length).toBe(1); // recreated, not resurrected
    expect(scene.add.image).toHaveBeenCalledTimes(4); // box and icon again
    expect(scene.add.text).toHaveBeenCalledTimes(2); // value text again
  });
});
