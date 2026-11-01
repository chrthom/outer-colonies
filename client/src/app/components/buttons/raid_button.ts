import Game from '../../scenes/game';
import { layoutConfig } from '../../config/layout';
import { BattleType } from '../../../../../server/src/shared/config/enums';
import { BattleActionButton } from './battle_action_button';

export default class RaidButton extends BattleActionButton {
  constructor(scene: Game) {
    super(scene, BattleType.Raid, layoutConfig.game.ui.raidButton, 'raid', 'Überfall');
  }
}
