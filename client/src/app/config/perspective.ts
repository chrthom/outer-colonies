class PerspectiveConfig {
  readonly distance = {
    near: -0.7,
    board: -10,
    far: -25,
    stackStep: 0.01,
    zoneStep: 0.2
  };
  readonly origin = {
    x: 1200,
    y: 675
  };
  private readonly factor = {
    card: {
      x: 0.0054,
      y: -0.00395
    },
    corner: {
      x: 0.0164,
      y: -0.0164
    }
  };
  toCardXOffset(x: number) {
    return x * this.factor.card.x;
  }
  fromCardXOffset(x: number) {
    return x / this.factor.card.x;
  }
  toCardX(x: number): number {
    return this.toCardXOffset(x - this.origin.x);
  }
  fromCardX(x: number): number {
    return this.fromCardXOffset(x) + this.origin.x;
  }
  toCardYOffset(y: number) {
    return y * this.factor.card.y;
  }
  fromCardYOffset(y: number) {
    return y / this.factor.card.y;
  }
  toCardY(y: number): number {
    return this.toCardYOffset(y - this.origin.y);
  }
  fromCardY(y: number): number {
    return this.fromCardXOffset(y) + this.origin.y;
  }
  toCornerX(x: number): number {
    return (x - this.origin.x) * this.factor.corner.x;
  }
  toCornerY(y: number): number {
    return (y - this.origin.y) * this.factor.corner.y;
  }
}

export const perspectiveConfig = new PerspectiveConfig();
