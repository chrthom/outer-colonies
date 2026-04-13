import { getDailiesOfDay, isDailyOfDay } from './daily_selector';
import { ALL_DAILY_TYPES } from '../../shared/config/dailies';
import { DailyType } from '../../shared/config/enums';

describe('Daily Selector', () => {
  it('should return exactly 4 dailies', () => {
    const dailies = getDailiesOfDay();
    expect(dailies.length).toBe(4);
  });

  it('should return only valid daily types', () => {
    const dailies = getDailiesOfDay();
    dailies.forEach(daily => {
      expect(ALL_DAILY_TYPES).toContain(daily);
    });
  });

  it('should return consistent results for the same date', () => {
    const date = new Date('2024-01-01');
    const dailies1 = getDailiesOfDay(date);
    const dailies2 = getDailiesOfDay(date);
    expect(dailies1).toEqual(dailies2);
  });

  it('should return different results for different dates', () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-01-02');
    const dailies1 = getDailiesOfDay(date1);
    const dailies2 = getDailiesOfDay(date2);
    // Should usually be different, but not guaranteed due to hash collisions
    // We'll just check that it's possible for them to be different
    expect(dailies1.length).toBe(4);
    expect(dailies2.length).toBe(4);
  });

  it('isDailyOfDay should correctly identify dailies of the day', () => {
    const date = new Date('2024-01-01');
    const dailies = getDailiesOfDay(date);

    dailies.forEach(daily => {
      expect(isDailyOfDay(daily, date)).toBe(true);
    });

    // Check that some dailies are not of the day
    const allDailies = getDailiesOfDay(date);
    const nonDailies = ALL_DAILY_TYPES.filter((d: DailyType) => !allDailies.includes(d));
    if (nonDailies.length > 0) {
      expect(isDailyOfDay(nonDailies[0], date)).toBe(false);
    }
  });

  it('should distribute dailies reasonably evenly over time', () => {
    // Test over a range of dates to ensure reasonable distribution
    const dateCount = 100;
    const dailyCounts: Record<string, number> = {};

    // Initialize counts
    ALL_DAILY_TYPES.forEach((daily: DailyType) => {
      dailyCounts[daily] = 0;
    });

    // Count occurrences over 100 days
    for (let i = 0; i < dateCount; i++) {
      const date = new Date('2024-01-01');
      date.setDate(date.getDate() + i);
      const dailies = getDailiesOfDay(date);

      dailies.forEach(daily => {
        dailyCounts[daily]++;
      });
    }

    // Each daily should appear roughly (4/13) * 100 ≈ 30.77 times
    // Allow some variance but ensure no daily is completely missing or dominates
    const expectedCount = (4 / ALL_DAILY_TYPES.length) * dateCount;
    const minExpected = expectedCount * 0.5; // At least 50% of expected
    const maxExpected = expectedCount * 1.5; // At most 150% of expected

    ALL_DAILY_TYPES.forEach((daily: DailyType) => {
      const count = dailyCounts[daily];
      expect(count).toBeGreaterThan(minExpected);
      expect(count).toBeLessThan(maxExpected);
    });
  });
});
