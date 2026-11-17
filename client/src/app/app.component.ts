import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import Phaser from 'phaser';
import MatchmakingScene from './scenes/matchmaking';
import GameScene from './scenes/game';
import { environment } from 'src/environments/environment';
import { layoutConfig } from './config/layout';

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
    disableContextMenu: true
  };
  phaserGame?: Phaser.Game;

  constructor() {
    console.log(`Outer Colonies client started on stage ${environment.stage}`);
  }

  ngAfterViewInit(): void {
    // The game canvas mounts into the view, so the game can only be created
    // once the view exists; it boots asynchronously from here.
    this.phaserGame = new Phaser.Game(this.config);
  }

  ngOnDestroy(): void {
    this.phaserGame?.destroy(true);
    this.phaserGame = undefined;
  }
}
