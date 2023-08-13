import { layoutConfig } from './layout';

export interface BackgroundOrb {
  cardId: number;
  name: string;
  ring: number;
  distance: number;
}

class BackgroundConfig {
  readonly animation = {
    duration: 3000,
    durationNextRing: 2500,
    starsHeight: 1600,
    offDistance: 2500,
    minRingScale: 0.1,
    bigScale: 2.5,
    smallScale: 0.003,
    ringMaxScale: 1.3,
    orbScale: 1,
    orbX: layoutConfig.scene.width / 2,
    orbYPlayer: layoutConfig.scene.height + 200,
    orbYOpponent: -200
  };

  readonly depth = {
    ring: 100,
    orb: 200
  };

  readonly orbs: BackgroundOrb[] = [
    {
      cardId: 146,
      name: 'europa',
      ring: 4,
      distance: 1
    },
    {
      cardId: 159,
      name: 'ganymed',
      ring: 4,
      distance: 0.7
    },
    {
      cardId: 112,
      name: 'titan',
      ring: 5,
      distance: 1
    },
    {
      cardId: 432,
      name: 'oberon',
      ring: 6,
      distance: 0.2
    },
    {
      cardId: 433,
      name: 'triton',
      ring: 7,
      distance: 1
    }
  ];

  readonly rings = ['venus', 'earth', 'mars', 'belt', 'jupiter', 'saturn', 'uranus', 'neptun', 'kuiper'];
}

export const backgroundConfig = new BackgroundConfig();
