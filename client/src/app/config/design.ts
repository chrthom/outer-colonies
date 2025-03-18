class DesignConfig {
  readonly alpha = {
    normal: 0.8,
    faded: 0.3,
    transparent: 0.1
  };
  readonly tint = {
    dark: 0x000000,
    faded: 0x666666,
    neutral: 0xffffff,
    player: 0x119999,
    opponent: 0x991111
  };
  readonly fontFamily = {
    caption: 'latin-modern-mono-caps',
    text: 'latin-modern-sans'
  };
  readonly color = {
    neutral: '#ffffff',
    hover: '#eeeeaa',
    warn: '#991111',
    pointDefense: '#999911',
    shield: '#119999',
    armour: '#999999',
    damage: '#991111',
    player: '#119999',
    opponent: '#991111'
  };
}

export const designConfig = new DesignConfig();
