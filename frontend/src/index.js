import Phaser from 'phaser';
import MatchmakingScene from './scenes/matchmaking'
import GameScene from './scenes/game'

const config = {
    type: Phaser.AUTO,
    scene: [ MatchmakingScene, GameScene ],
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game',
        width: 1320,
        height: 720,
    }
};

const game = new Phaser.Game(config);
