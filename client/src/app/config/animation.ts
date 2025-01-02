class AnimationConfig {
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
  readonly duration = {
    loaderCycle: 1000,
    attack: 1000,
    handExpand: 250,
    displayIndicator: 200,
    draw: 400,
    move: 550,
    showTacticCard: 600,
    min: 10,
    promptShow: 3000,
    zoomCard: 150
  };
  readonly gameOver = {
    appear: 2500,
    timeOffset: 1200
  };
}

export const animationConfig = new AnimationConfig();
