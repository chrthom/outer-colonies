import { layoutGameConfig } from './layout_game';

export interface Coordinates {
  x: number;
  y: number;
}

export class FontSizeConfig {
  readonly small = 20;
  readonly normal = 28;
  readonly large = 36;
  readonly giant = 150;
}

class LayoutConfig {
  readonly game = layoutGameConfig;
  readonly depth = {
    background: -1000,
    cardStack: 0,
    cardStackExpanded: 15,
    indicator: 30,
    discardCard: 40,
    handCard: 50,
    battleEffect: 70,
    maxedTacticCard: 80
  };
  readonly fontSize = new FontSizeConfig();
  readonly scene = {
    height: 1350,
    width: 2400
  };
}

export const layoutConfig = new LayoutConfig();
