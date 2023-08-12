import { Component, OnInit } from '@angular/core';
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
export class AppComponent implements OnInit {
  phaserGame: Phaser.Game;
  config: Phaser.Types.Core.GameConfig;

  constructor() {
    console.log(`Outer Colonies client started on stage ${environment.stage}`);
    this.config = {
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
  }
  ngOnInit() {
    this.phaserGame = new Phaser.Game(this.config);
  }
}
