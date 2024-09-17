import { layoutGameConfig } from './layout_game';
import { layoutLoadConfig } from './layout_load';

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
  readonly load = layoutLoadConfig;
  readonly game = layoutGameConfig;
  readonly depth = {
    background: -1000,
    cardStack: 0,
    indicator: 30,
    discardCard: 50,
    handCard: 70,
    battleEffect: 85,
    prompt: 90,
    maxCard: 95,
    maxedTacticCard: 100
  };
  readonly fontSize = new FontSizeConfig();
  readonly scene = {
    height: 1350,
    width: 2400
  };
}

export const layoutConfig = new LayoutConfig();
