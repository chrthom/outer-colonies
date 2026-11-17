/**
 * Names of all released card editions, keyed by edition number.
 * The edition number of a card is the hundreds digit of its card ID (e.g. cards 101-199 belong to edition 1).
 * Shared between the trade page (booster list), the deck page (edition labels) and future pages.
 */
export const editions: Record<number, string> = {
  1: 'Outer Colonies',
  2: 'Jovians Freihändler',
  3: 'Marsianische Hegemonie',
  4: 'Kuiper-Gürtel',
  5: 'Sichere Häfen'
};
