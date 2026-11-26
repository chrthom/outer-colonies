import Phaser from 'phaser';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
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

    const teardown = () => {
      if (this.isShutDown) return;
      this.isShutDown = true;
      this.subscriptions?.unsubscribe();
      this.subscriptions = undefined;
      this.matchmaking.stop();
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, teardown);
    this.events.once(Phaser.Scenes.Events.DESTROY, teardown);
  }

  private async initBackground(): Promise<void> {
    try {
      await this.assetPreloader.preloadRequired();
      if (this.isShutDown || !this.textures) return;
      this.assetPreloader.registerPhaserTextures(this.textures);
      new Background(this);
      await this.assetPreloader.preloadCommon();
    } catch (err) {
      if (environment.stage !== 'production') {
        console.error(`Failed to initialize matchmaking background: ${err}`);
      }
    }
  }
}
