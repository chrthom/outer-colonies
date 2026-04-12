#!/usr/bin/env ts-node

/**
 * Script to generate SQL for dailies table from centralized configuration
 * Run with: npx ts-node misc/generate_dailies_sql.ts
 */

interface DailyDefinition {
  type: string;
  dbColumn: string;
  solReward: number;
  title: string;
  description: string;
}

const DAILY_DEFINITIONS: DailyDefinition[] = [
  { type: 'login', dbColumn: 'login', solReward: 35, title: 'Tägliche Inspektion', description: 'Melde dich im Online Portal an.' },
  { type: 'victory', dbColumn: 'victory', solReward: 45, title: 'Der Duft des Sieges', description: 'Erringe einen Sieg.' },
  { type: 'game', dbColumn: 'game', solReward: 70, title: 'Bis zum bitteren Ende', description: 'Beende ein Spiel, ohne dass ein Spieler kapituliert.' },
  { type: 'energy', dbColumn: 'energy', solReward: 90, title: 'Bereit zur Expansion', description: 'Beende ein Spiel mit mindestens 6 überschüssigen Energiepunkten.' },
  { type: 'ships', dbColumn: 'ships', solReward: 115, title: 'Armada', description: 'Beende ein Spiel mit mindestens 5 eigenen Schiffen.' },
  { type: 'domination', dbColumn: 'domination', solReward: 100, title: 'Vorherrschaft', description: 'Erringe einen Sieg durch Vorherrschaft.' },
  { type: 'destruction', dbColumn: 'destruction', solReward: 85, title: 'Keine Gefangenen', description: 'Erringe einen Sieg durch Zerstörung der gegnerischen Kolonie.' },
  { type: 'control', dbColumn: 'control', solReward: 115, title: 'Potentes Einsatzteam', description: 'Beende ein Spiel mit mindestens 6 Kontrollpunkten durch deine Schiffe.' },
  { type: 'juggernaut', dbColumn: 'juggernaut', solReward: 120, title: 'Juggernaut', description: 'Besitze zum Spielende ein Schiff mit mindestens 20 Hüllenpunkten.' },
  { type: 'stations', dbColumn: 'stations', solReward: 105, title: 'Ich bleibe hier', description: 'Besitze zum Spielende 3 oder mehr Hüllenkarten mit Geschwindigkeit 0.' },
  { type: 'discard', dbColumn: 'discard', solReward: 130, title: 'Der lange Krieg', description: 'Lege mindestens 50 Karten in einem Spiel ab.' },
  { type: 'colony', dbColumn: 'colony', solReward: 110, title: 'Sweet Home', description: 'Habe zum Spielende mindestens 7 Koloniekarten in deiner Koloniezone.' },
  { type: 'colossus', dbColumn: 'colossus', solReward: 125, title: 'Der Koloss', description: 'Besitze zum Spielende ein Schiff, das aus mindestens 7 Karten besteht.' }
];

function generateDailiesSQL(): string {
  const columns = DAILY_DEFINITIONS.map(daily =>
    `  \`${daily.dbColumn}\` date DEFAULT NULL`
  ).join(',\n');

  return `CREATE TABLE \`dailies\` (
  \`user_id\` bigint(20) UNSIGNED NOT NULL,
${columns}
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;`;
}

function generateAlterTableSQL(): string {
  return DAILY_DEFINITIONS.map(daily =>
    `ALTER TABLE \`dailies\` ADD COLUMN \`${daily.dbColumn}\` date DEFAULT NULL;`
  ).join('\n');
}

// Export functions for programmatic use
module.exports = {
  generateDailiesSQL,
  generateAlterTableSQL
};