class PerspectiveConfig {
  readonly distance = {
    near: -0.7,
    board: -10,
    far: -25
  };
  readonly origin = {
    x: 885,
    y: 675
  };
  private readonly factor = {
    card: {
      x: 0.0054,
      y: -0.00395
    },
    maxCard: {
      x: 0.0015,
      y: -0.00115
    },
    minCard: {
      x: 0.0115,
      y: -0.0085
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
    return this.fromCardYOffset(y) + this.origin.y;
  }
  toCornerX(x: number): number {
    return (x - this.origin.x) * this.factor.corner.x;
  }
  toCornerY(y: number): number {
    return (y - this.origin.y) * this.factor.corner.y;
  }
  toMaxCardX(x: number): number {
    return (x - this.origin.x) * this.factor.maxCard.x;
  }
  toMaxCardY(y: number): number {
    return (y - this.origin.y) * this.factor.maxCard.y;
  }
  toMinCardXOffset(x: number) {
    return x * this.factor.minCard.x;
  }
  toMinCardX(x: number): number {
    return this.toMinCardXOffset(x - this.origin.x);
  }
  toMinCardYOffset(y: number) {
    return y * this.factor.minCard.y;
  }
  toMinCardY(y: number): number {
    return this.toMinCardYOffset(y - this.origin.y);
  }
}

export const perspectiveConfig = new PerspectiveConfig();
