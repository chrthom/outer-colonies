import { perspectiveConfig } from '../config/perspective';

export abstract class PerspectivePosition {
  protected readonly value: number;
  protected readonly is3d: boolean;
  protected abstract readonly factor: number;
  protected abstract readonly isXAxis: boolean;
  constructor(value: number, is3d?: boolean) {
    this.value = value;
    this.is3d = is3d ?? false;
  }
  get value3d() {
    return this.is3d ? this.value : (this.value - this.origin) * this.factor;
  }
  get value2d() {
    return this.is3d ? this.value / this.factor + this.origin : this.value;
  }
  private get origin() {
    return this.isXAxis ? perspectiveConfig.origin.x : perspectiveConfig.origin.y;
  }
}

export class CardXPosition extends PerspectivePosition {
  factor = perspectiveConfig.factor.card.x;
  isXAxis = true;
  plus(x: number): CardXPosition {
    return new CardXPosition(this.value2d + x);
  }
}

export class CardYPosition extends PerspectivePosition {
  factor = perspectiveConfig.factor.card.y;
  isXAxis = false;
  plus(y: number): CardYPosition {
    return new CardYPosition(this.value2d + y);
  }
}

export class MaxCardXPosition extends PerspectivePosition {
  factor = perspectiveConfig.factor.maxCard.x;
  isXAxis = true;
}

export class MaxCardYPosition extends PerspectivePosition {
  factor = perspectiveConfig.factor.maxCard.y;
  isXAxis = false;
}

export class MinCardXPosition extends PerspectivePosition {
  factor = perspectiveConfig.factor.minCard.x;
  isXAxis = true;
  plus(x: number): MinCardXPosition {
    return new MinCardXPosition(this.value2d + x);
  }
}

export class MinCardYPosition extends PerspectivePosition {
  factor = perspectiveConfig.factor.minCard.y;
  isXAxis = false;
  plus(y: number): MinCardYPosition {
    return new MinCardYPosition(this.value2d + y);
  }
}

export class CornerXPosition extends PerspectivePosition {
  factor = perspectiveConfig.factor.corner.x;
  isXAxis = true;
}

export class CornerYPosition extends PerspectivePosition {
  factor = perspectiveConfig.factor.corner.y;
  isXAxis = false;
}
