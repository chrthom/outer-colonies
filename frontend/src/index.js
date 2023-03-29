import Phaser from 'phaser';
import MatchmakingScene from './scenes/matchmaking'
import GameScene from './scenes/game'

const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 1200,
    height: 700,
    scene: [ MatchmakingScene, GameScene ]
};

const game = new Phaser.Game(config);
