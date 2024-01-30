import { Component } from '@angular/core';
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
export class AppComponent {
  config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scene: [MatchmakingScene, GameScene],
    scale: {
      mode: Phaser.Scale.FIT,
      parent: 'game',
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: layoutConfig.scene.width,
      height: layoutConfig.scene.height
    }
  };
  phaserGame: Phaser.Game = new Phaser.Game(this.config);

  constructor() {
    console.log(`Outer Colonies client started on stage ${environment.stage}`);
  }
}
