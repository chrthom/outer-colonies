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
  readonly factor = {
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
}

export const perspectiveConfig = new PerspectiveConfig();
