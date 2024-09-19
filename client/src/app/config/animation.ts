class AnimationConfig {
  readonly duration = {
    loaderCycle: 1000,
    attack: 1000,
    handExpand: 350,
    draw: 400,
    move: 500,
    showTacticCard: 600,
    min: 10,
    promptShow: 3000,
    zoomCard: 150
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
