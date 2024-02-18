class LayoutLoadConfig {
  readonly loadingAnimation = {
    x: 1200,
    y: 750,
    radius: 64,
    barWidth: 10,
    textOffsetY: -120
  };
  readonly preloader = {
    x: 1200,
    y: 700,
    width: 500,
    height: 50,
    boxPadding: 10,
    textOffsetY: -50
  };
  readonly version = {
    x: 2360,
    y: 1340
  };
}

export const layoutLoadConfig = new LayoutLoadConfig();
