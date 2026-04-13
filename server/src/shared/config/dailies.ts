import { DailyType } from './enums';

export interface DailyDefinition {
  type: DailyType;
  dbColumn: string;
  solReward: number;
  title: string;
  description: string;
}

export const DAILY_DEFINITIONS: DailyDefinition[] = [
  {
    type: DailyType.Login,
    dbColumn: 'login',
    solReward: 35,
    title: 'Tägliche Inspektion',
    description: 'Melde dich im Online Portal an.'
  },
  {
    type: DailyType.Victory,
    dbColumn: 'victory',
    solReward: 45,
    title: 'Der Duft des Sieges',
    description: 'Erringe einen Sieg.'
  },
  {
    type: DailyType.Game,
    dbColumn: 'game',
    solReward: 70,
    title: 'Bis zum bitteren Ende',
    description: 'Beende ein Spiel, ohne dass ein Spieler kapituliert.'
  },
  {
    type: DailyType.Energy,
    dbColumn: 'energy',
    solReward: 90,
    title: 'Bereit zur Expansion',
    description: 'Beende ein Spiel mit mindestens 6 überschüssigen Energiepunkten.'
  },
  {
    type: DailyType.Ships,
    dbColumn: 'ships',
    solReward: 115,
    title: 'Armada',
    description: 'Beende ein Spiel mit mindestens 5 eigenen Schiffen.'
  },
  {
    type: DailyType.Domination,
    dbColumn: 'domination',
    solReward: 100,
    title: 'Vorherrschaft',
    description: 'Erringe einen Sieg durch Vorherrschaft.'
  },
  {
    type: DailyType.Destruction,
    dbColumn: 'destruction',
    solReward: 85,
    title: 'Keine Gefangenen',
    description: 'Erringe einen Sieg durch Zerstörung der gegnerischen Kolonie.'
  },
  {
    type: DailyType.Control,
    dbColumn: 'control',
    solReward: 115,
    title: 'Potentes Einsatzteam',
    description: 'Beende ein Spiel mit mindestens 6 Kontrollpunkten durch deine Schiffe.'
  },
  {
    type: DailyType.Juggernaut,
    dbColumn: 'juggernaut',
    solReward: 120,
    title: 'Juggernaut',
    description: 'Besitze zum Spielende ein Schiff mit mindestens 20 Hüllenpunkten.'
  },
  {
    type: DailyType.Stations,
    dbColumn: 'stations',
    solReward: 105,
    title: 'Ich bleibe hier',
    description: 'Besitze zum Spielende 3 oder mehr Hüllenkarten mit Geschwindigkeit 0.'
  },
  {
    type: DailyType.Discard,
    dbColumn: 'discard',
    solReward: 130,
    title: 'Der lange Krieg',
    description: 'Lege mindestens 50 Karten in einem Spiel ab.'
  },
  {
    type: DailyType.Colony,
    dbColumn: 'colony',
    solReward: 110,
    title: 'Sweet Home',
    description: 'Habe zum Spielende mindestens 7 Koloniekarten in deiner Koloniezone.'
  },
  {
    type: DailyType.Colossus,
    dbColumn: 'colossus',
    solReward: 125,
    title: 'Der Koloss',
    description: 'Besitze zum Spielende ein Schiff, das aus mindestens 7 Karten besteht.'
  }
];

export const ALL_DAILY_TYPES = DAILY_DEFINITIONS.map(d => d.type);
export const DAILY_COLUMNS = DAILY_DEFINITIONS.map(d => d.dbColumn);
