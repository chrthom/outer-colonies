import { layoutConfig } from './layout';

export interface BackgroundOrb {
  cardId: number;
  name: string;
  ring: number;
  distance: number;
}

export interface BackgroundRandomVessel {
  probability: number;
  vessel: string;
  startX: number;
  startY: number;
  startScale?: number;
  startAngle?: number;
  endX: number;
  endY: number;
  endScale?: number;
  endAngle?: number;
  combatOnly?: boolean;
  orbitOnly?: boolean;
  ease?: string;
}

class BackgroundConfig {
  readonly animation = {
    randomEventInterval: 1000,
    durationTransition: 3000,
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

  readonly randomVessels: BackgroundRandomVessel[] = [
    {
      probability: 0.005,
      vessel: 'freighter1',
      startX: layoutConfig.scene.width + 620,
      startY: layoutConfig.scene.height * 0.4,
      startAngle: 15,
      startScale: 0.8,
      endX: -750,
      endY: layoutConfig.scene.height * 0.6,
      endScale: 1
    },
    {
      probability: 0.005,
      vessel: 'freighter2',
      startX: layoutConfig.scene.width + 300,
      startY: layoutConfig.scene.height * 0.4,
      startScale: 0.4,
      startAngle: -15,
      endX: 0,
      endY: layoutConfig.scene.height + 650,
      endScale: 1.8,
      endAngle: 20,
      ease: 'Quad.easeIn'
    },
    {
      probability: 0.005,
      vessel: 'freighter3',
      startX: -430,
      startY: -300,
      startScale: 0.5,
      endX: layoutConfig.scene.width - 100,
      endY: layoutConfig.scene.height + 650,
      endScale: 1.2,
      ease: 'Quad.easeIn'
    },
    {
      probability: 0.02,
      vessel: 'corvette1',
      startX: 300,
      startY: layoutConfig.scene.height + 600,
      startScale: 1.2,
      endX: layoutConfig.scene.width + 300,
      endY: 200,
      endScale: 0.2,
      combatOnly: true,
      ease: 'Cubic'
    },
    {
      probability: 0.02,
      vessel: 'corvette1',
      startX: layoutConfig.scene.width * 0.75,
      startY: layoutConfig.scene.height + 450,
      startScale: 0.3,
      startAngle: -80,
      endX: layoutConfig.scene.width * 0.5,
      endY: -150,
      endScale: 0.1,
      endAngle: -100,
      combatOnly: true,
      ease: 'Quad'
    }
  ]

  readonly depth = {
    ring: 100,
    orb: 200,
    vessel: 300
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
