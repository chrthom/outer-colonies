export default class CardProfile implements CardProfileConfig {
  pointDefense!: number;
  shield!: number;
  armour!: number;
  hp!: number;
  speed!: number;
  energy!: number;
  theta!: number;
  xi!: number;
  phi!: number;
  omega!: number;
  delta!: number;
  psi!: number;
  handCardLimit!: number;
  constructor(profile: CardProfileConfig = {}) {
    this.pointDefense = profile.pointDefense ?? 0;
    this.shield = profile.shield ?? 0;
    this.armour = profile.armour ?? 0;
    this.hp = profile.hp ?? 0;
    this.speed = profile.speed ?? 0;
    this.energy = profile.energy ?? 0;
    this.theta = profile.theta ?? 0;
    this.xi = profile.xi ?? 0;
    this.phi = profile.phi ?? 0;
    this.omega = profile.omega ?? 0;
    this.delta = profile.delta ?? 0;
    this.psi = profile.psi ?? 0;
    this.handCardLimit = profile.handCardLimit ?? 0;
  }
  combine(c: CardProfile): CardProfile {
    return new CardProfile({
      hp: this.hp + c.hp,
      speed: this.speed + c.speed,
      energy: this.energy + c.energy,
      theta: this.theta + c.theta,
      xi: this.xi + c.xi,
      phi: this.phi + c.phi,
      omega: this.omega + c.omega,
      delta: this.delta + c.delta,
      psi: this.psi + c.psi,
      pointDefense: Math.max(this.pointDefense, c.pointDefense),
      shield: Math.max(this.shield, c.shield),
      armour: Math.max(this.armour, c.armour),
      handCardLimit: this.handCardLimit + c.handCardLimit
    });
  }
  get isValid(): boolean {
    return Object.values(this).filter(v => v < 0).length == 0;
  }
}

export interface CardProfileConfig {
  pointDefense?: number;
  shield?: number;
  armour?: number;
  hp?: number;
  speed?: number;
  energy?: number;
  theta?: number;
  xi?: number;
  phi?: number;
  omega?: number;
  delta?: number;
  psi?: number;
  handCardLimit?: number;
}

export interface AttackProfile {
  range: number;
  damage: number;
  pointDefense: number;
  shield: number;
  armour: number;
}
