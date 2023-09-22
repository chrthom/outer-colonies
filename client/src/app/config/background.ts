import { layoutConfig } from './layout';

export interface BackgroundOrb {
  cardId?: number;
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
  readonly depth = {
    ring: 100,
    orb: 200,
    effects: 300,
    vessel: 400
  };

  readonly animation = {
    randomEventInterval: 1000,
    durationObjectTransition: 2500,
    durationNextRing: 1800,
    starsHeight: 1600,
    offDistance: 2500,
    minRingScale: 0.1,
    bigScale: 2.5,
    smallScale: 0.003,
    ringMaxScale: 1.3,
    orbScale: 1,
    orbX: layoutConfig.scene.width / 2 + 125,
    orbYPlayer: layoutConfig.scene.height + 200,
    orbYOpponent: -200
  };

  readonly orbs: BackgroundOrb[] = [
    {
      name: 'vesta',
      ring: 3,
      distance: 1
    },
    {
      name: 'enceladus',
      ring: 5,
      distance: 1
    },
    {
      name: 'rhea',
      ring: 5,
      distance: 0.5
    },
    {
      name: 'iapetus',
      ring: 5,
      distance: 0.05
    },
    {
      name: 'ariel',
      ring: 6,
      distance: 1
    },
    {
      name: 'titania',
      ring: 6,
      distance: 0.3
    },
    {
      cardId: 146,
      name: 'europa',
      ring: 4,
      distance: 0.7
    },
    {
      cardId: 159,
      name: 'ganymed',
      ring: 4,
      distance: 0.4
    },
    {
      cardId: 317,
      name: 'kallisto',
      ring: 4,
      distance: 0.2
    },
    {
      cardId: 112,
      name: 'titan',
      ring: 5,
      distance: 0.4
    },
    {
      cardId: 432,
      name: 'oberon',
      ring: 6,
      distance: 0.1
    },
    {
      cardId: 433,
      name: 'triton',
      ring: 7,
      distance: 1
    },
    {
      cardId: 403,
      name: 'pluto',
      ring: 8,
      distance: 0.3
    }
  ];

  get defaultBackgroundOrbNames(): string[] {
    return this.orbs.filter(o => !o.cardId).map(o => o.name);
  }

  readonly rings = ['venus', 'earth', 'mars', 'belt', 'jupiter', 'saturn', 'uranus', 'neptun', 'kuiper'];

  readonly randomCombatEffects = {
    multiplier: 5,
    autogun: {
      probability: 0.1,
      speed: 20000,
      spread: 5,
      maxScale: 1,
      lifetime: 800,
      frequency: 100,
      duration: this.animation.durationNextRing / 2
    },
    laser: {
      probability: 0.1,
      duration: 200,
      alpha: 0.5,
      range: 2500,
      colors: [0xff0000, 0x00ff00, 0x00aaff]
    },
    explosion: {
      probability: 0.08,
      duration: 3000,
      maxScale: 2,
      maxSpeed: 5,
      minParticles: 8,
      maxParticles: 15,
      colors: ['white', 'blue']
    }
  };

  readonly randomVessels: BackgroundRandomVessel[] = [
    {
      probability: 0.004,
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
      probability: 0.006,
      vessel: 'freighter2',
      startX: layoutConfig.scene.width + 300,
      startY: layoutConfig.scene.height * 0.4,
      startScale: 0.4,
      startAngle: -15,
      endX: 0,
      endY: layoutConfig.scene.height + 650,
      endScale: 1.8,
      endAngle: 20,
      orbitOnly: true,
      ease: 'Quad.easeIn'
    },
    {
      probability: 0.004,
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
      probability: 0.015,
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
    },
    {
      probability: 0.012,
      vessel: 'corvette2',
      startX: -400,
      startY: layoutConfig.scene.height * 0.2,
      endX: layoutConfig.scene.width + 400,
      endY: layoutConfig.scene.height * 0.4,
      endScale: 0.9,
      endAngle: -10,
      combatOnly: true
    },
    {
      probability: 0.02,
      vessel: 'corvette2',
      startX: layoutConfig.scene.width * 0.3,
      startY: layoutConfig.scene.height + 120,
      startScale: 0.2,
      startAngle: -100,
      endX: layoutConfig.scene.width * 0.4,
      endY: -60,
      endScale: 0.1,
      endAngle: -90,
      combatOnly: true,
      ease: 'Quad'
    },
    {
      probability: 0.014,
      vessel: 'corvette3',
      startX: 1000,
      startY: layoutConfig.scene.height - 800,
      startScale: 0.01,
      startAngle: -20,
      endX: -1050,
      endY: layoutConfig.scene.height - 100,
      endScale: 2,
      endAngle: 20,
      combatOnly: true,
      ease: 'Quint.easeIn'
    },
    {
      probability: 0.014,
      vessel: 'corvette3',
      startX: layoutConfig.scene.width * 0.3,
      startY: -400,
      startScale: 0.8,
      startAngle: -170,
      endX: layoutConfig.scene.width + 1000,
      endY: layoutConfig.scene.height * 0.4,
      endScale: 1.5,
      endAngle: -140,
      combatOnly: true,
      ease: 'Cubic.easeIn'
    },
    {
      probability: 0.005,
      vessel: 'station1',
      startX: layoutConfig.scene.width + 185,
      startY: layoutConfig.scene.height * 0.7,
      endX: -185,
      endY: layoutConfig.scene.height * 0.75,
      endAngle: 70,
      orbitOnly: true
    },
    {
      probability: 0.02,
      vessel: 'torpedos1',
      startX: layoutConfig.scene.width * 0.6,
      startY: layoutConfig.scene.height * 0.5,
      startScale: 0.01,
      endX: layoutConfig.scene.width + 500,
      endY: layoutConfig.scene.height + 1000,
      endScale: 2,
      combatOnly: true,
      ease: 'Cubic.easeIn'
    },
    {
      probability: 0.02,
      vessel: 'torpedos1',
      startX: layoutConfig.scene.width * 0.4,
      startY: layoutConfig.scene.height * 0.4,
      startScale: 0.01,
      startAngle: 130,
      endX: -1000,
      endY: layoutConfig.scene.height * 0.5,
      endScale: 2,
      combatOnly: true,
      ease: 'Cubic.easeIn'
    },
    {
      probability: 0.004,
      vessel: 'asteroid1',
      startX: -450,
      startY: layoutConfig.scene.height * 0.7,
      startAngle: -40,
      endX: layoutConfig.scene.width + 450,
      endY: layoutConfig.scene.height * 0.9,
      endAngle: -80
    },
    {
      probability: 0.005,
      vessel: 'asteroid1',
      startX: -90,
      startY: layoutConfig.scene.height * 0.4,
      startScale: 0.2,
      endX: layoutConfig.scene.width,
      endY: -90,
      endAngle: -50
    }
  ];
}

export const backgroundConfig = new BackgroundConfig();
