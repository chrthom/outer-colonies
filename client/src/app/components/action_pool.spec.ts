import ActionPool from './action_pool';
import { layoutConfig } from '../config/layout';
import { designConfig } from '../config/design';
import Game from '../scenes/game';

interface MockImage {
  setOrigin: jasmine.Spy;
  setTint: jasmine.Spy;
  setAlpha: jasmine.Spy;
  destroy: jasmine.Spy;
}

const makeImage = (): MockImage => {
  const image = {
    setOrigin: jasmine.createSpy('setOrigin'),
    setTint: jasmine.createSpy('setTint'),
    setAlpha: jasmine.createSpy('setAlpha'),
    destroy: jasmine.createSpy('destroy')
  };
  [image.setOrigin, image.setTint, image.setAlpha].forEach(spy => spy.and.returnValue(image));
  return image;
};

interface SceneStub {
  getPlayerState: jasmine.Spy;
  add: { image: jasmine.Spy };
}

describe('ActionPool', () => {
  let mockScene: SceneStub;
  let actionPool: ActionPool;

  beforeEach(() => {
    // Mock Phaser scene with necessary methods
    mockScene = {
      getPlayerState: jasmine.createSpy('getPlayerState').and.returnValue({
        actionPool: ['attack', 'defend']
      }),
      add: {
        image: jasmine.createSpy('image').and.callFake(makeImage)
      }
    };

    actionPool = new ActionPool(mockScene as unknown as Game, true); // ownedByPlayer = true
  });

  it('should destroy existing images when destroyed', () => {
    // Add some mock images - use a type assertion since we are testing behavior, not Phaser types
    const mockImage1 = { destroy: jasmine.createSpy('destroy1') };
    const mockImage2 = { destroy: jasmine.createSpy('destroy2') };

    actionPool.images = [mockImage1, mockImage2] as unknown as Phaser.GameObjects.Image[];

    actionPool.destroy();

    expect(mockImage1.destroy).toHaveBeenCalled();
    expect(mockImage2.destroy).toHaveBeenCalled();
    expect(actionPool.images).toEqual([]);
  });

  it('should update action pool with player actions', () => {
    actionPool.update();

    // Verify getPlayerState was called
    expect(mockScene.getPlayerState).toHaveBeenCalledWith(true);

    // Verify images were created
    expect(mockScene.add.image).toHaveBeenCalledTimes(2);

    // Verify first action (attack)
    const firstCall = mockScene.add.image.calls.first();
    expect(firstCall.args[0]).toBe(layoutConfig.game.ui.actionPool.player.x);
    expect(firstCall.args[1]).toBe(layoutConfig.game.ui.actionPool.player.y);
    expect(firstCall.args[2]).toBe('icon_attack');

    // Verify second action (defend)
    const secondCall = mockScene.add.image.calls.mostRecent();
    expect(secondCall.args[0]).toBe(layoutConfig.game.ui.actionPool.player.x);
    expect(secondCall.args[1]).toBe(
      layoutConfig.game.ui.actionPool.player.y + layoutConfig.game.ui.actionPool.player.yDistance
    );
    expect(secondCall.args[2]).toBe('icon_defend');
  });

  it('should use different placement for opponent', () => {
    const opponentActionPool = new ActionPool(mockScene as unknown as Game, false); // ownedByPlayer = false
    opponentActionPool.update();

    // Verify getPlayerState was called with false
    expect(mockScene.getPlayerState).toHaveBeenCalledWith(false);

    // Verify opponent placement config is used
    const firstCall = mockScene.add.image.calls.first();
    expect(firstCall.args[0]).toBe(layoutConfig.game.ui.actionPool.opponent.x);
    expect(firstCall.args[1]).toBe(layoutConfig.game.ui.actionPool.opponent.y);
  });

  it('should apply correct tint based on player ownership', () => {
    // Test player ownership (should use player tint)
    actionPool.update();
    const playerCall = mockScene.add.image.calls.first();
    const playerImage = playerCall.returnValue as MockImage;
    expect(playerImage.setTint).toHaveBeenCalledWith(
      designConfig.tint.player,
      designConfig.tint.neutral,
      designConfig.tint.player,
      designConfig.tint.player
    );

    // Test opponent ownership (should use opponent tint)
    const opponentActionPool = new ActionPool(mockScene as unknown as Game, false);
    opponentActionPool.update();
    const opponentCall = mockScene.add.image.calls.mostRecent();
    const opponentImage = opponentCall.returnValue as MockImage;
    expect(opponentImage.setTint).toHaveBeenCalledWith(
      designConfig.tint.opponent,
      designConfig.tint.neutral,
      designConfig.tint.opponent,
      designConfig.tint.opponent
    );
  });

  it('should handle empty action pool gracefully', () => {
    mockScene.getPlayerState.and.returnValue({ actionPool: [] });
    actionPool.update();

    expect(mockScene.add.image).not.toHaveBeenCalled();
    expect(actionPool.images).toEqual([]);
  });

  it('should destroy old images before creating new ones', () => {
    // First update
    actionPool.update();
    const firstImages = [...actionPool.images];

    // Second update with different actions
    mockScene.getPlayerState.and.returnValue({ actionPool: ['move'] });
    actionPool.update();

    // Verify old images were destroyed
    firstImages.forEach(img => expect(img.destroy).toHaveBeenCalled());

    // Verify new images were created
    expect(actionPool.images.length).toBe(1);
    expect(mockScene.add.image).toHaveBeenCalledWith(
      layoutConfig.game.ui.actionPool.player.x,
      layoutConfig.game.ui.actionPool.player.y,
      'icon_move'
    );
  });
});
