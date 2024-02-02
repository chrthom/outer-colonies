class DesignConfig {
  readonly colors = {
    alpha: 0.8,
    fadedAlpha: 0.3,
    fadedTint: 0x666666,
    neutral: 0xffffff,
    primary: 0x119999,
    secondary: 0x991111

  };
  readonly font = {
    captionFamily: 'latin-modern-mono-caps',
    textFamily: 'latin-modern-sans',
    color: '#ffffff',
    colorHover: '#eeeeaa',
    colorWarn: '#991111'
  };
  readonly attackColor = {
    pointDefense: '#999911',
    shield: '#119999',
    armour: '#999999',
    damage: '#991111'
  }
}

export const designConfig = new DesignConfig();
