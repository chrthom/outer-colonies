import { backgroundConfig } from '../config/background';

export function loadRequiredResources(apiURL: string, load: Phaser.Loader.LoaderPlugin) {
  load.baseURL = `${apiURL}/assets/`;
  load.image('background', `background/stars${Math.floor(Math.random() * 7)}.jpg`);
  load.image('icon_exit', 'icons/exit.png');
  load.image('background_sun', 'background/sun.png');
}

export function loadPreloadableResources(apiURL: string, load: Phaser.Loader.LoaderPlugin) {
  load.baseURL = `${apiURL}/assets/`;
  backgroundConfig.orbs
    .map(o => o.name)
    .forEach(name => load.image(`background_orb_${name}`, `background/orb_${name}.png`));
  backgroundConfig.rings.forEach(name =>
    load.image(`background_ring_${name}`, `background/ring_${name}.png`)
  );
  [
    'asteroid1',
    'corvette1',
    'corvette2',
    'corvette3',
    'freighter1',
    'freighter2',
    'freighter3',
    'station1',
    'torpedos1'
  ].forEach(name => load.image(`background_vessel_${name}`, `background/vessel_${name}.png`));
  [
    'damage',
    'hp',
    'speed',
    'energy',
    'theta',
    'xi',
    'phi',
    'omega',
    'delta',
    'psi',
    'armour',
    'shield',
    'point_defense'
  ].forEach(attribute => load.image(`attribute_${attribute}`, `attribute/${attribute}.png`));
  ['mask', 'mask_small', 'glow', 'glow_small', 'pile_1', 'pile_2', 'pile_3', 'pile_4'].forEach(name =>
    load.image(`card_${name}`, `utils/card_${name}.png`)
  );
  ['blue', 'red'].forEach(color =>
    load.image(`card_stack_info_box_${color}`, `utils/card_stack_info_box_${color}.png`)
  );
  ['red', 'yellow', 'blue', 'white'].forEach(color =>
    load.image(`flare_${color}`, `utils/flare_${color}.png`)
  );
  ['defeat', 'victory'].forEach(gameOver =>
    load.image(`game_over_${gameOver}`, `utils/game_over_${gameOver}.png`)
  );
  [
    'equipment',
    'hull',
    'infrastructure',
    'tactic',
    'intelligence',
    'military',
    'science',
    'trade',
    'hull_infrastructure',
    'equipment_hull',
    'equipment_hull_infrastructure',
    'equipment_hull_infrastructure_tactic',
    'retract_card',
    'exit'
  ].forEach(name => load.image(`icon_${name}`, `icons/${name}.png`));
  load.image('prompt_box', 'utils/prompt_box.png');
  [1, 2, 3, 4].forEach(r => load.image(`range_${r}`, `utils/range${r}.png`));
  load.image('zone_corner', 'utils/zone_corner.png');
  [
    'active_build',
    'active_combat',
    'active_select',
    'active_wait',
    'won',
    'inactive_combat',
    'inactive_select',
    'inactive_wait',
    'lost'
  ].forEach(name => load.image(`button_${name}`, `utils/button_${name}.png`));
}

export function loadCardResources(apiURL: string, load: Phaser.Loader.LoaderPlugin, cardIds: number[]) {
  load.baseURL = `${apiURL}/assets/`;
  [0, 1].concat(cardIds).forEach(id => load.image(`card_${id}`, `cards/${id}.png`));
}
