import Phaser from 'phaser';
import { Subscription } from 'rxjs';
import Background from '../components/background';
import ExitButton from '../components/buttons/exit_button';
import OnlineIndicator from '../components/indicators/online_indicator';
import VersionIndicator from '../components/indicators/version_indicator';
import LoadingStatus from '../components/loading_status';
import { MatchmakingService } from '../services/matchmaking_service';
import { SERVICE_REGISTRY_KEYS } from '../services/service_registry';
import { loadPreloadableResources, loadRequiredResources } from './resource-loader';

export default class Matchmaking extends Phaser.Scene {
  status!: LoadingStatus;
  onlineIndicator!: OnlineIndicator;
  matchmaking!: MatchmakingService;
  private subscriptions?: Subscription;

  constructor() {
    super({
      key: 'Matchmaking'
    });
  }

  preload() {
    loadRequiredResources(this.load);
  }

  create() {
    this.matchmaking = this.registry.get(SERVICE_REGISTRY_KEYS.matchmaking);
    this.status = new LoadingStatus(this);
    new VersionIndicator(this);
    this.onlineIndicator = new OnlineIndicator(this);
    new ExitButton(this);
    new Background(this);
    loadPreloadableResources(this.load);
    this.bindMatchmakingService();
  }

  /**
   * Binds the scene UI elements to `MatchmakingService` streams and cleans up
   * subscriptions on scene shutdown.
   */
  private bindMatchmakingService(): void {
    this.subscriptions?.unsubscribe();
    const sub = new Subscription();
    sub.add(
      this.matchmaking.matchStart$.subscribe(gameParams => {
        this.scene.start('Game', { gameParams });
      })
    );
    this.matchmaking.start();
    sub.add(
      this.matchmaking.statusText$.subscribe(text => {
        this.status.setText(text);
      })
    );
    sub.add(
      this.matchmaking.onlineCount$.subscribe(count => {
        if (count !== undefined) {
          this.onlineIndicator.setCount(count);
        }
      })
    );
    this.subscriptions = sub;

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.subscriptions?.unsubscribe();
      this.subscriptions = undefined;
      this.matchmaking.stop();
    });
  }
}
