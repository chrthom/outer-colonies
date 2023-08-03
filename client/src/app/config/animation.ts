class AnimationConfig {
  readonly duration = {
    attack: 1000,
    draw: 400,
    move: 500,
    showTacticCard: 600,
    waitBeforeDiscard: 2000,
    buffer: 50
  };
  readonly attack = {
    indicator: {
      yOffset: -230,
      yOffsetOpponent: 50,
      yTween: -150,
      spawnInterval: 200
    },
    flare: {
      yOffset: -160,
      yOffsetOpponent: 120,
      lifetime: 1600
    }
  };
}

export const animationConfig = new AnimationConfig();
