import { AfterViewInit, Component, OnDestroy, inject } from '@angular/core';
import Phaser from 'phaser';
import MatchmakingScene from './scenes/matchmaking';
import GameScene from './scenes/game';
import { environment } from 'src/environments/environment';
import { layoutConfig } from './config/layout';
import { SocketService } from './socket_service';
import { MatchmakingService } from './services/matchmaking_service';
import { GameSessionService } from './services/game_session_service';
import { GameInteractionService } from './services/game_interaction_service';
import { SERVICE_REGISTRY_KEYS } from './services/service_registry';

@Component({
  selector: 'app-root',
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
  }
}
