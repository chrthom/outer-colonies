import Phaser from 'phaser';
import MatchmakingScene from './scenes/matchmaking'
import GameScene from './scenes/game'

const config = {
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

const game = new Phaser.Game(config);
