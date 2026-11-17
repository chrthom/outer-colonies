import { createHash } from 'crypto';
import { DailyType } from '../../shared/config/enums';
import { ALL_DAILY_TYPES } from '../../shared/config/dailies';

export function getDailiesOfDay(date: Date = new Date()): DailyType[] {
  // Use date string to create consistent hash for the day
  const dateString = date.toISOString().split('T')[0];
  const hash = createHash('md5').update(dateString).digest('hex');

  const hashNumber = parseInt(hash.substring(0, 8), 16);

  const indices: number[] = [];
  const maxIndex = ALL_DAILY_TYPES.length - 1;

  for (let i = 0; i < 4; i++) {
    const part = parseInt(hash.substring(i * 2, i * 2 + 2), 16);
    const index = (part + i * hashNumber) % (maxIndex + 1);

    if (!indices.includes(index)) {
      indices.push(index);
    } else {
      let newIndex = (index + 1) % (maxIndex + 1);
      while (indices.includes(newIndex)) {
        newIndex = (newIndex + 1) % (maxIndex + 1);
      }
      indices.push(newIndex);
    }
  }

  return indices.map(i => ALL_DAILY_TYPES[i]);
}

export function isDailyOfDay(daily: DailyType, date: Date = new Date()): boolean {
  const dailiesOfDay = getDailiesOfDay(date);
  return dailiesOfDay.includes(daily);
}
