class AnimationConfig {
  readonly duration = {
    loaderCycle: 1000,
    attack: 1000,
    draw: 400,
    move: 500,
    showTacticCard: 600,
    waitBeforeDiscard: 2000,
    waitBeforeMaximize: 400,
    buffer: 50,
    promptShow: 3000
  };
  readonly attack = {
    indicator: {
      yTween: -150,
      spawnInterval: 200,
      duration: 2300
    },
    flare: {
      lifetime: 1600
    }
  };
}

export const animationConfig = new AnimationConfig();
