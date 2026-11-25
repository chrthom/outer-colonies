/**
 * Registry keys used to pass Angular root services into Phaser scenes via `Phaser.Game.registry`.
 */
export const SERVICE_REGISTRY_KEYS = {
  matchmaking: 'matchmakingService',
  gameSession: 'gameSessionService',
  gameInteraction: 'gameInteractionService',
  assetPreloader: 'assetPreloaderService'
} as const;
