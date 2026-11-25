import { AsyncPipe } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, inject } from '@angular/core';
import Phaser from 'phaser';
import { environment } from 'src/environments/environment';
import { layoutConfig } from './config/layout';
import GameScene from './scenes/game';
import MatchmakingScene from './scenes/matchmaking';
import { AssetPreloaderService } from './services/asset_preloader_service';
import { GameInteractionService } from './services/game_interaction_service';
import { GameSessionService } from './services/game_session_service';
import { MatchmakingService } from './services/matchmaking_service';
import { SERVICE_REGISTRY_KEYS } from './services/service_registry';
import { SocketService } from './socket_service';
import { GameHudComponent } from './ui/game_hud.component';
import { MatchmakingOverlayComponent } from './ui/matchmaking_overlay.component';
import { OptionPickerComponent } from './ui/option_picker.component';

@Component({
  selector: 'app-root',
  imports: [AsyncPipe, MatchmakingOverlayComponent, GameHudComponent, OptionPickerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scene: [MatchmakingScene, GameScene],
    scale: {
      mode: Phaser.Scale.FIT,
      parent: 'game',
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: layoutConfig.scene.width,
      height: layoutConfig.scene.height
    },
    disableContextMenu: true,
    callbacks: {
      preBoot: game => this.registerServices(game)
    }
  };
  phaserGame?: Phaser.Game;

  private readonly socketService = inject(SocketService);
  private readonly matchmakingService = inject(MatchmakingService);
  private readonly gameSessionService = inject(GameSessionService);
  private readonly gameInteractionService = inject(GameInteractionService);
  private readonly assetPreloaderService = inject(AssetPreloaderService);

  readonly matchmakingActive$ = this.matchmakingService.active$;
  readonly gameActive$ = this.gameSessionService.active$;

  constructor() {
    if (environment.stage !== 'production') {
      console.log(`Outer Colonies client started on stage ${environment.stage}`);
    }
  }

  ngAfterViewInit(): void {
    // The game canvas mounts into the view, so the game can only be created
    // once the view exists; it boots asynchronously from here.
    this.phaserGame = new Phaser.Game(this.config);
  }

  ngOnDestroy(): void {
    this.matchmakingService.stop();
    this.gameSessionService.stopSession();
    this.gameInteractionService.reset();
    this.socketService.disconnect();
    this.phaserGame?.destroy(true);
    this.phaserGame = undefined;
  }

  private registerServices(game: Phaser.Game): void {
    game.registry.set(SERVICE_REGISTRY_KEYS.matchmaking, this.matchmakingService);
    game.registry.set(SERVICE_REGISTRY_KEYS.gameSession, this.gameSessionService);
    game.registry.set(SERVICE_REGISTRY_KEYS.gameInteraction, this.gameInteractionService);
    game.registry.set(SERVICE_REGISTRY_KEYS.assetPreloader, this.assetPreloaderService);
  }
}
