import { FontSizeConfig } from "./layout";

class LayoutGameConfig {
  private fontSize = new FontSizeConfig();

  readonly cardStackYDistance = 30;

  readonly cards = {
    scale: {
      min: 0.1,
      normal: 0.25,
      max: 0.75
    },
    damageIndicator: {
      xOffsetPlayer: -75,
      yOffsetPlayer: -265,
      xOffsetOpponent: -75,
      yOffsetOpponent: 265
    },
    defenseIndicator: {
      xOffset: -85,
      yOffsetPlayer: -190,
      yOffsetOpponent: 20,
      yDistance: 50
    },
    retractCardButton: {
      xOffset: -45,
      yOffset: -252
    }
  };
}

export const layoutGameConfig = new LayoutGameConfig();
  