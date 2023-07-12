import { Component, OnInit } from '@angular/core';
import Phaser from 'phaser';
import MatchmakingScene from './scenes/matchmaking';
import GameScene from './scenes/game';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  phaserGame: Phaser.Game;
  config: Phaser.Types.Core.GameConfig;

  constructor() {
    this.config = {
      type: Phaser.AUTO,
      scene: [ MatchmakingScene, GameScene ],
      scale: {
          mode: Phaser.Scale.FIT,
          parent: 'game',
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 2400,
          height: 1350
      }
    };
  }
  ngOnInit() {
    this.phaserGame = new Phaser.Game(this.config);
  }
}
