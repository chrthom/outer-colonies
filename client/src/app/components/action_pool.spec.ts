import ActionPool from './action_pool';
import { layoutConfig } from '../config/layout';
import { designConfig } from '../config/design';
import { asGameScene, makeGameObjectStub, makeSceneStub, SceneStub } from '../testing/phaser_stubs';

describe('ActionPool', () => {
  let scene: SceneStub;
  let actionPool: ActionPool;

  beforeEach(() => {
    scene = makeSceneStub();
    scene.getPlayerState.and.returnValue({ actionPool: ['attack', 'defend'] });
    actionPool = new ActionPool(asGameScene(scene), true); // ownedByPlayer = true
  });

  it('should destroy existing images when destroyed', () => {
    // Stub game objects stand in for real Phaser images, hence the cast
    const mockImage1 = makeGameObjectStub() as any;
    const mockImage2 = makeGameObjectStub() as any;

    actionPool.images = [mockImage1, mockImage2];

    actionPool.destroy();

    expect(mockImage1.destroy).toHaveBeenCalled();
    expect(mockImage2.destroy).toHaveBeenCalled();
    expect(actionPool.images).toEqual([]);
  });

  it('should update action pool with player actions', () => {
    actionPool.update();

    // Verify getPlayerState was called
    expect(scene.getPlayerState).toHaveBeenCalledWith(true);

    // Verify images were created
    expect(scene.add.image).toHaveBeenCalledTimes(2);

    // Verify first action (attack)
    const firstCall = scene.add.image.calls.first();
    expect(firstCall.args[0]).toBe(layoutConfig.game.ui.actionPool.player.x);
    expect(firstCall.args[1]).toBe(layoutConfig.game.ui.actionPool.player.y);
    expect(firstCall.args[2]).toBe('icon_attack');

    // Verify second action (defend)
    const secondCall = scene.add.image.calls.mostRecent();
    expect(secondCall.args[0]).toBe(layoutConfig.game.ui.actionPool.player.x);
    expect(secondCall.args[1]).toBe(
      layoutConfig.game.ui.actionPool.player.y + layoutConfig.game.ui.actionPool.player.yDistance
    );
    expect(secondCall.args[2]).toBe('icon_defend');
  });

  it('should use different placement for opponent', () => {
    const opponentActionPool = new ActionPool(asGameScene(scene), false); // ownedByPlayer = false
    opponentActionPool.update();

    // Verify getPlayerState was called with false
    expect(scene.getPlayerState).toHaveBeenCalledWith(false);

    // Verify opponent placement config is used
    const firstCall = scene.add.image.calls.first();
    expect(firstCall.args[0]).toBe(layoutConfig.game.ui.actionPool.opponent.x);
    expect(firstCall.args[1]).toBe(layoutConfig.game.ui.actionPool.opponent.y);
  });

  it('should apply correct tint based on player ownership', () => {
    // Test player ownership (should use player tint)
    actionPool.update();
    const playerCall = scene.add.image.calls.first();
    const playerImage = playerCall.returnValue;
    expect(playerImage.setTint).toHaveBeenCalledWith(
      designConfig.tint.player,
      designConfig.tint.neutral,
      designConfig.tint.player,
      designConfig.tint.player
    );

    // Test opponent ownership (should use opponent tint)
    const opponentActionPool = new ActionPool(asGameScene(scene), false);
    opponentActionPool.update();
    const opponentCall = scene.add.image.calls.mostRecent();
    const opponentImage = opponentCall.returnValue;
    expect(opponentImage.setTint).toHaveBeenCalledWith(
      designConfig.tint.opponent,
      designConfig.tint.neutral,
      designConfig.tint.opponent,
      designConfig.tint.opponent
    );
  });

  it('should handle empty action pool gracefully', () => {
    scene.getPlayerState.and.returnValue({ actionPool: [] });
    actionPool.update();

    expect(scene.add.image).not.toHaveBeenCalled();
    expect(actionPool.images).toEqual([]);
  });

  it('should destroy old images before creating new ones', () => {
    // First update
    actionPool.update();
    const firstImages = [...actionPool.images];

    // Second update with different actions
    scene.getPlayerState.and.returnValue({ actionPool: ['move'] });
    actionPool.update();

    // Verify old images were destroyed
    firstImages.forEach(img => expect(img.destroy).toHaveBeenCalled());

    // Verify new images were created
    expect(actionPool.images.length).toBe(1);
    expect(scene.add.image).toHaveBeenCalledWith(
      layoutConfig.game.ui.actionPool.player.x,
      layoutConfig.game.ui.actionPool.player.y,
      'icon_move'
    );
  });
});
