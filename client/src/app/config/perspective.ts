class PerspectiveConfig {
  readonly distance = {
    near: 2.2,
    expanded: -6.6,
    board: -7.5,
    far: -18.7
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
