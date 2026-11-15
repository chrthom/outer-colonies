import Game from '../../scenes/game';
import { layoutConfig } from '../../config/layout';
import { BattleType } from '@shared/config/enums';
import { BattleActionButton } from './battle_action_button';

export default class MissionButton extends BattleActionButton {
  constructor(scene: Game) {
    super(scene, BattleType.Mission, layoutConfig.game.ui.missionButton, 'mission', 'Mission');
  }
}
