import ColonyCard from '../types/colony_card';
import {
  Card160,
  Card186,
  Card220,
  Card243,
  Card342,
  Card348,
  Card351,
  Card436,
  Card439,
  Card450
} from './hull_1_part_cards';
import {
  Card103,
  Card115,
  Card140,
  Card163,
  Card170,
  Card171,
  Card184,
  Card240,
  Card312,
  Card341,
  Card349,
  Card406,
  Card426,
  Card447
} from './equipment_defense_cards';
import {
  Card130,
  Card168,
  Card181,
  Card234,
  Card237,
  Card339,
  Card340,
  Card424,
  Card440,
  Card441
} from './equipment_weapon_point_defense_cards';
import {
  Card135,
  Card137,
  Card138,
  Card147,
  Card148,
  Card154,
  Card164,
  Card183,
  Card219,
  Card336
} from './infrastructure_action_cards';
import {
  Card105,
  Card145,
  Card185,
  Card187,
  Card188,
  Card242,
  Card244,
  Card245,
  Card350,
  Card352,
  Card353,
  Card451,
  Card452,
  Card453
} from './infrastructure_energy_cards';
import { Card141, Card165, Card232, Card235, Card236, Card321, Card427 } from './tactic_economy_cards';
import {
  Card102,
  Card111,
  Card113,
  Card119,
  Card128,
  Card152,
  Card153,
  Card158,
  Card228,
  Card311,
  Card446
} from './hull_station_cards';
import {
  Card166,
  Card182,
  Card224,
  Card343,
  Card344,
  Card347,
  Card421
} from './equipment_weapon_laser_cards';
import {
  Card126,
  Card151,
  Card179,
  Card180,
  Card223,
  Card310,
  Card420
} from './equipment_weapon_kinetic_cards';
import { Card104, Card109, Card161, Card325, Card434, Card449 } from './equipment_util_cards';
import { Card118, Card125, Card157, Card209, Card303, Card409 } from './equipment_weapon_plasma_cards';
import { Card106, Card107, Card203, Card207, Card405, Card438 } from './equipment_weapon_particle_cards';
import {
  Card101,
  Card127,
  Card136,
  Card150,
  Card167,
  Card216,
  Card304,
  Card318,
  Card412,
  Card422
} from './equipment_weapon_torpedo_cards';
import {
  Card131,
  Card132,
  Card177,
  Card178,
  Card213,
  Card221,
  Card226,
  Card326,
  Card327,
  Card328,
  Card329,
  Card418,
  Card444,
  Card445
} from './hull_2_part_cards';
import {
  Card116,
  Card117,
  Card120,
  Card121,
  Card122,
  Card133,
  Card134,
  Card306,
  Card308,
  Card309,
  Card313,
  Card314,
  Card315
} from './hull_3_part_cards';
import {
  Card139,
  Card173,
  Card174,
  Card319,
  Card331,
  Card337,
  Card338,
  Card346,
  Card428
} from './tactic_military_cards';
import {
  Card110,
  Card144,
  Card162,
  Card233,
  Card316,
  Card324,
  Card335,
  Card429,
  Card443
} from './tactic_science_cards';
import Card from '../card';
import { Card172 } from './infrastructure_util_cards';
import { Card230, Card333, Card435 } from './infrastructure_start_cards';
import { Card114, Card155 } from './infrastructure_end_cards';
import { Rarity } from '../../../shared/config/enums';
import { Card302, Card401 } from './equipment_weapon_super_cards';
import { Card146, Card159, Card301, Card317, Card403, Card410, Card432, Card433 } from './orb_cards';
import { Card156, Card169, Card238, Card345, Card448 } from './infrastructure_defense_cards';
import { Card129, Card176, Card231, Card416 } from './tactic_intelligence_cards';
import { starterDecks } from '../../../shared/config/starter_decks';

export default class CardCollection {
  static cards = {
    0: <Card>new ColonyCard(),
    101: <Card>new Card101(),
    102: <Card>new Card102(),
    103: <Card>new Card103(),
    104: <Card>new Card104(),
    105: <Card>new Card105(),
    106: <Card>new Card106(),
    107: <Card>new Card107(),
    109: <Card>new Card109(),
    110: <Card>new Card110(),
    111: <Card>new Card111(),
    113: <Card>new Card113(),
    114: <Card>new Card114(),
    115: <Card>new Card115(),
    116: <Card>new Card116(),
    117: <Card>new Card117(),
    118: <Card>new Card118(),
    119: <Card>new Card119(),
    120: <Card>new Card120(),
    121: <Card>new Card121(),
    122: <Card>new Card122(),
    125: <Card>new Card125(),
    126: <Card>new Card126(),
    127: <Card>new Card127(),
    128: <Card>new Card128(),
    129: <Card>new Card129(),
    130: <Card>new Card130(),
    131: <Card>new Card131(),
    132: <Card>new Card132(),
    133: <Card>new Card133(),
    134: <Card>new Card134(),
    135: <Card>new Card135(),
    136: <Card>new Card136(),
    137: <Card>new Card137(),
    138: <Card>new Card138(),
    139: <Card>new Card139(),
    140: <Card>new Card140(),
    141: <Card>new Card141(),
    144: <Card>new Card144(),
    145: <Card>new Card145(),
    146: <Card>new Card146(),
    147: <Card>new Card147(),
    148: <Card>new Card148(),
    150: <Card>new Card150(),
    151: <Card>new Card151(),
    152: <Card>new Card152(),
    153: <Card>new Card153(),
    154: <Card>new Card154(),
    155: <Card>new Card155(),
    156: <Card>new Card156(),
    157: <Card>new Card157(),
    158: <Card>new Card158(),
    159: <Card>new Card159(),
    160: <Card>new Card160(),
    161: <Card>new Card161(),
    162: <Card>new Card162(),
    163: <Card>new Card163(),
    164: <Card>new Card164(),
    165: <Card>new Card165(),
    166: <Card>new Card166(),
    167: <Card>new Card167(),
    168: <Card>new Card168(),
    169: <Card>new Card169(),
    170: <Card>new Card170(),
    171: <Card>new Card171(),
    172: <Card>new Card172(),
    173: <Card>new Card173(),
    174: <Card>new Card174(),
    176: <Card>new Card176(),
    177: <Card>new Card177(),
    178: <Card>new Card178(),
    179: <Card>new Card179(),
    180: <Card>new Card180(),
    181: <Card>new Card181(),
    182: <Card>new Card182(),
    183: <Card>new Card183(),
    184: <Card>new Card184(),
    185: <Card>new Card185(),
    186: <Card>new Card186(),
    187: <Card>new Card187(),
    188: <Card>new Card188(),
    203: <Card>new Card203(),
    207: <Card>new Card207(),
    209: <Card>new Card209(),
    213: <Card>new Card213(),
    216: <Card>new Card216(),
    219: <Card>new Card219(),
    220: <Card>new Card220(),
    221: <Card>new Card221(),
    223: <Card>new Card223(),
    224: <Card>new Card224(),
    226: <Card>new Card226(),
    228: <Card>new Card228(),
    230: <Card>new Card230(),
    231: <Card>new Card231(),
    232: <Card>new Card232(),
    233: <Card>new Card233(),
    234: <Card>new Card234(),
    235: <Card>new Card235(),
    236: <Card>new Card236(),
    237: <Card>new Card237(),
    238: <Card>new Card238(),
    240: <Card>new Card240(),
    242: <Card>new Card242(),
    243: <Card>new Card243(),
    244: <Card>new Card244(),
    245: <Card>new Card245(),
    301: <Card>new Card301(),
    302: <Card>new Card302(),
    303: <Card>new Card303(),
    304: <Card>new Card304(),
    306: <Card>new Card306(),
    308: <Card>new Card308(),
    309: <Card>new Card309(),
    310: <Card>new Card310(),
    311: <Card>new Card311(),
    312: <Card>new Card312(),
    313: <Card>new Card313(),
    314: <Card>new Card314(),
    315: <Card>new Card315(),
    316: <Card>new Card316(),
    317: <Card>new Card317(),
    318: <Card>new Card318(),
    319: <Card>new Card319(),
    321: <Card>new Card321(),
    324: <Card>new Card324(),
    325: <Card>new Card325(),
    326: <Card>new Card326(),
    327: <Card>new Card327(),
    328: <Card>new Card328(),
    329: <Card>new Card329(),
    331: <Card>new Card331(),
    333: <Card>new Card333(),
    335: <Card>new Card335(),
    336: <Card>new Card336(),
    337: <Card>new Card337(),
    338: <Card>new Card338(),
    339: <Card>new Card339(),
    340: <Card>new Card340(),
    341: <Card>new Card341(),
    342: <Card>new Card342(),
    343: <Card>new Card343(),
    344: <Card>new Card344(),
    345: <Card>new Card345(),
    346: <Card>new Card346(),
    347: <Card>new Card347(),
    348: <Card>new Card348(),
    349: <Card>new Card349(),
    350: <Card>new Card350(),
    351: <Card>new Card351(),
    352: <Card>new Card352(),
    353: <Card>new Card353(),
    401: <Card>new Card401(),
    403: <Card>new Card403(),
    405: <Card>new Card405(),
    406: <Card>new Card406(),
    409: <Card>new Card409(),
    410: <Card>new Card410(),
    412: <Card>new Card412(),
    416: <Card>new Card416(),
    418: <Card>new Card418(),
    420: <Card>new Card420(),
    421: <Card>new Card421(),
    422: <Card>new Card422(),
    424: <Card>new Card424(),
    426: <Card>new Card426(),
    427: <Card>new Card427(),
    428: <Card>new Card428(),
    429: <Card>new Card429(),
    432: <Card>new Card432(),
    433: <Card>new Card433(),
    434: <Card>new Card434(),
    435: <Card>new Card435(),
    436: <Card>new Card436(),
    438: <Card>new Card438(),
    439: <Card>new Card439(),
    440: <Card>new Card440(),
    441: <Card>new Card441(),
    443: <Card>new Card443(),
    444: <Card>new Card444(),
    445: <Card>new Card445(),
    446: <Card>new Card446(),
    447: <Card>new Card447(),
    448: <Card>new Card448(),
    449: <Card>new Card449(),
    450: <Card>new Card450(),
    451: <Card>new Card451(),
    452: <Card>new Card452(),
    453: <Card>new Card453()
  };

  static allCards = Object.values(this.cards);
  static starterDecks: Card[][] = starterDecks.map(sd =>
    sd
      .map(c => Array(c[0]).fill(c[1]))
      .flat()
      .map(cid => <Card>this.cards[cid])
  );

  static generateBoosterContent(edition: number): Card[] {
    const cards: Card[] = [];
    [Array(6).fill(Rarity.Common), Array(3).fill(Rarity.Uncommon), Array(1).fill(Rarity.Rare)]
      .flat()
      .forEach(rarity => {
        const pickAction = () => this.pickRandomCard(edition, rarity);
        const newCard = pickAction();
        cards.push(cards.some(c => c.id == newCard.id) ? pickAction() : newCard);
      });
    return cards;
  }

  private static pickRandomCard(edition: number, rarity: Rarity): Card {
    const relevantCards = this.allCards
      .filter(c => Math.floor(c.id / 100) == edition)
      .filter(
        c =>
          (rarity == Rarity.Common && c.rarity <= 1) ||
          (rarity == Rarity.Uncommon && c.rarity == 2) ||
          (rarity == Rarity.Rare && c.rarity >= 3)
      )
      .flatMap(c => {
        switch (c.rarity) {
          case 0:
            return Array(5).fill(c);
          case 1:
            return Array(4).fill(c);
          case 2:
            return [c];
          case 3:
            return Array(4).fill(c);
          case 4:
            return Array(2).fill(c);
          case 5:
            return [c];
          default:
            return [];
        }
      });
    return relevantCards[Math.floor(Math.random() * relevantCards.length)];
  }
}
