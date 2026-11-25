import Phaser from 'phaser';
import { Subscription } from 'rxjs';
import Background from '../components/background';
import { AssetPreloaderService } from '../services/asset_preloader_service';
import { MatchmakingService } from '../services/matchmaking_service';
import { SERVICE_REGISTRY_KEYS } from '../services/service_registry';

/**
 * Thin Phaser scene rendering the space background while Angular renders the
 * matchmaking overlay and `MatchmakingService` manages lobby sockets.
 */
export default class Matchmaking extends Phaser.Scene {
  matchmaking!: MatchmakingService;
  assetPreloader!: AssetPreloaderService;
  private subscriptions?: Subscription;
  private isShutDown = false;

  constructor() {
    super({
      key: 'Matchmaking'
    });
  }

  create() {
    this.isShutDown = false;
    this.matchmaking = this.registry.get(SERVICE_REGISTRY_KEYS.matchmaking);
    this.assetPreloader = this.registry.get(SERVICE_REGISTRY_KEYS.assetPreloader);
    this.bindMatchmakingService();
    void this.initBackground();
  }

  /**
   * Binds scene navigation to `MatchmakingService` and cleans up on shutdown.
   */
  private bindMatchmakingService(): void {
    this.subscriptions?.unsubscribe();
    const sub = new Subscription();
    sub.add(
      this.matchmaking.matchStart$.subscribe(gameParams => {
        this.scene.start('Game', { gameParams });
      })
    );
    this.subscriptions = sub;
    this.matchmaking.start();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.isShutDown = true;
      this.subscriptions?.unsubscribe();
      this.subscriptions = undefined;
      this.matchmaking.stop();
    });
  }

  private async initBackground(): Promise<void> {
    await this.assetPreloader.preloadRequired();
    if (this.isShutDown) return;
    this.assetPreloader.registerPhaserTextures(this.textures);
    new Background(this);
    void this.assetPreloader.preloadCommon();
  }
}
