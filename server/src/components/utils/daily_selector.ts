import { createHash } from 'crypto';

export type DailyType =
  | 'login'
  | 'victory'
  | 'game'
  | 'energy'
  | 'ships'
  | 'domination'
  | 'destruction'
  | 'control'
  | 'juggernaut'
  | 'stations'
  | 'discard'
  | 'colony'
  | 'colossus';

export const ALL_DAILIES: DailyType[] = [
  'login',
  'victory',
  'game',
  'energy',
  'ships',
  'domination',
  'destruction',
  'control',
  'juggernaut',
  'stations',
  'discard',
  'colony',
  'colossus'
];

export function getDailiesOfDay(date: Date = new Date()): DailyType[] {
  // Use date string to create consistent hash for the day
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
  const hash = createHash('md5').update(dateString).digest('hex');

  // Convert hash to a number
  const hashNumber = parseInt(hash.substring(0, 8), 16);

  // Use hash to select 4 unique indices
  const indices: number[] = [];
  const maxIndex = ALL_DAILIES.length - 1;

  // Simple algorithm to generate 4 unique indices based on hash
  for (let i = 0; i < 4; i++) {
    // Use different parts of the hash for each index
    const part = parseInt(hash.substring(i * 2, i * 2 + 2), 16);
    const index = (part + i * hashNumber) % (maxIndex + 1);

    // Ensure uniqueness
    if (!indices.includes(index)) {
      indices.push(index);
    } else {
      // If duplicate, find next available index
      let newIndex = (index + 1) % (maxIndex + 1);
      while (indices.includes(newIndex)) {
        newIndex = (newIndex + 1) % (maxIndex + 1);
      }
      indices.push(newIndex);
    }
  }

  // Return the selected dailies
  return indices.map(i => ALL_DAILIES[i]);
}

export function isDailyOfDay(daily: DailyType, date: Date = new Date()): boolean {
  const dailiesOfDay = getDailiesOfDay(date);
  return dailiesOfDay.includes(daily);
}
