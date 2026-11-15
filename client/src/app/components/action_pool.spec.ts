import ActionPool from './action_pool';
import { layoutConfig } from '../config/layout';
import { designConfig } from '../config/design';

describe('ActionPool', () => {
  let mockScene: any;
  let actionPool: ActionPool;
  let mockImages: any[];

  beforeEach(() => {
    // Mock Phaser scene with necessary methods
    mockImages = [{ destroy: jasmine.createSpy('destroy') }, { destroy: jasmine.createSpy('destroy') }];

    // Mock the scene methods
    mockScene = {
      getPlayerState: jasmine.createSpy('getPlayerState').and.returnValue({
        actionPool: ['attack', 'defend']
      }),
      add: {
        image: jasmine.createSpy('image').and.callFake(() => {
          // Create mock image with proper typing - use a class to avoid circular references
          class MockImage {
            setOrigin = jasmine.createSpy().and.returnValue(this);
            setTint = jasmine.createSpy().and.returnValue(this);
            setAlpha = jasmine.createSpy().and.returnValue(this);
            setTexture = jasmine.createSpy().and.returnValue(this);
            destroy = jasmine.createSpy('destroy');
          }

          const mockImage = new MockImage();
          mockImages.push(mockImage);
          return mockImage;
        })
      }
    };

    actionPool = new ActionPool(mockScene, true); // ownedByPlayer = true
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
    const opponentActionPool = new ActionPool(mockScene, false); // ownedByPlayer = false
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
    const playerImage = playerCall.returnValue;
    expect(playerImage.setTint).toHaveBeenCalledWith(
      designConfig.tint.player,
      designConfig.tint.neutral,
      designConfig.tint.player,
      designConfig.tint.player
    );

    // Test opponent ownership (should use opponent tint)
    const opponentActionPool = new ActionPool(mockScene, false);
    opponentActionPool.update();
    const opponentCall = mockScene.add.image.calls.mostRecent();
    const opponentImage = opponentCall.returnValue;
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

  it('should reuse images and update their textures in place', () => {
    // First update
    actionPool.update();
    const firstImages = [...actionPool.images];
    expect(firstImages.length).toBe(2);

    // Second update with different actions of the same size
    mockScene.getPlayerState.and.returnValue({ actionPool: ['move', 'defend'] });
    actionPool.update();

    // Verify the same image objects are reused with updated textures
    expect(actionPool.images.length).toBe(2);
    expect(actionPool.images[0]).toBe(firstImages[0]);
    expect(actionPool.images[1]).toBe(firstImages[1]);
    expect(firstImages[0].setTexture).toHaveBeenCalledWith('icon_move');
    expect(firstImages[1].setTexture).toHaveBeenCalledWith('icon_defend');

    // No images were destroyed or recreated for the update
    firstImages.forEach(img => expect(img.destroy).not.toHaveBeenCalled());
    expect(mockScene.add.image).toHaveBeenCalledTimes(2); // only from the first update
  });

  it('should destroy only surplus images when the action pool shrinks', () => {
    actionPool.update();
    const firstImages = [...actionPool.images];

    mockScene.getPlayerState.and.returnValue({ actionPool: ['attack'] });
    actionPool.update();

    expect(actionPool.images.length).toBe(1);
    expect(actionPool.images[0]).toBe(firstImages[0]);
    expect(firstImages[0].setTexture).toHaveBeenCalledWith('icon_attack');
    expect(firstImages[1].destroy).toHaveBeenCalled();
    expect(firstImages[0].destroy).not.toHaveBeenCalled();
  });

  it('should recreate images after the pool was emptied and grows again', () => {
    actionPool.update();
    expect(actionPool.images.length).toBe(2);

    mockScene.getPlayerState.and.returnValue({ actionPool: [] });
    actionPool.update();
    expect(actionPool.images).toEqual([]);

    mockScene.getPlayerState.and.returnValue({ actionPool: ['attack', 'defend'] });
    actionPool.update();
    expect(actionPool.images.length).toBe(2);
    expect(mockScene.add.image).toHaveBeenCalledTimes(4); // 2 from each non-empty update
  });
});
