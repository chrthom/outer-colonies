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
  Card450,
  Card559
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
  Card447,
  Card522
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
  Card239,
  Card320,
  Card336,
  Card413
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
import {
  Card123,
  Card141,
  Card142,
  Card165,
  Card210,
  Card217,
  Card232,
  Card235,
  Card236,
  Card321,
  Card427,
  Card509,
  Card534,
  Card542
} from './tactic_economy_cards';
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
import {
  Card104,
  Card109,
  Card124,
  Card161,
  Card211,
  Card212,
  Card241,
  Card325,
  Card434,
  Card449,
  Card545
} from './equipment_util_cards';
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
  Card422,
  Card554,
  Card555
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
  Card129,
  Card139,
  Card173,
  Card174,
  Card319,
  Card331,
  Card334,
  Card337,
  Card338,
  Card346,
  Card419,
  Card428,
  Card501,
  Card504,
  Card531,
  Card532,
  Card533,
  Card550
} from './tactic_military_cards';
import {
  Card108,
  Card110,
  Card143,
  Card144,
  Card162,
  Card229,
  Card233,
  Card316,
  Card324,
  Card335,
  Card404,
  Card414,
  Card423,
  Card429,
  Card443,
  Card524,
  Card525,
  Card526,
  Card530
} from './tactic_science_cards';
import Card from '../card';
import { Card172 } from './infrastructure_util_cards';
import { Card230, Card333, Card435 } from './infrastructure_start_cards';
import { Card114, Card155 } from './infrastructure_end_cards';
import { Rarity } from '../../../shared/config/enums';
import { Card302, Card401 } from './equipment_weapon_super_cards';
import {
  Card112,
  Card146,
  Card159,
  Card225,
  Card301,
  Card317,
  Card403,
  Card410,
  Card432,
  Card433
} from './orb_cards';
import { Card156, Card169, Card238, Card345, Card448 } from './infrastructure_defense_cards';
import {
  Card149,
  Card175,
  Card176,
  Card205,
  Card208,
  Card214,
  Card222,
  Card231,
  Card323,
  Card330,
  Card416,
  Card417,
  Card430,
  Card517,
  Card528,
  Card529
} from './tactic_intelligence_cards';
import { starterDecks } from '../../../shared/config/starter_decks';
import { Card305 } from './infrastructure_special_cards';

export default class CardCollection {
  static cards: Record<number, Card> = {
    0: new ColonyCard(),
    101: new Card101(),
    102: new Card102(),
    103: new Card103(),
    104: new Card104(),
    105: new Card105(),
    106: new Card106(),
    107: new Card107(),
    108: new Card108(),
    109: new Card109(),
    110: new Card110(),
    111: new Card111(),
    112: new Card112(),
    113: new Card113(),
    114: new Card114(),
    115: new Card115(),
    116: new Card116(),
    117: new Card117(),
    118: new Card118(),
    119: new Card119(),
    120: new Card120(),
    121: new Card121(),
    122: new Card122(),
    123: new Card123(),
    124: new Card124(),
    125: new Card125(),
    126: new Card126(),
    127: new Card127(),
    128: new Card128(),
    129: new Card129(),
    130: new Card130(),
    131: new Card131(),
    132: new Card132(),
    133: new Card133(),
    134: new Card134(),
    135: new Card135(),
    136: new Card136(),
    137: new Card137(),
    138: new Card138(),
    139: new Card139(),
    140: new Card140(),
    141: new Card141(),
    142: new Card142(),
    143: new Card143(),
    144: new Card144(),
    145: new Card145(),
    146: new Card146(),
    147: new Card147(),
    148: new Card148(),
    149: new Card149(),
    150: new Card150(),
    151: new Card151(),
    152: new Card152(),
    153: new Card153(),
    154: new Card154(),
    155: new Card155(),
    156: new Card156(),
    157: new Card157(),
    158: new Card158(),
    159: new Card159(),
    160: new Card160(),
    161: new Card161(),
    162: new Card162(),
    163: new Card163(),
    164: new Card164(),
    165: new Card165(),
    166: new Card166(),
    167: new Card167(),
    168: new Card168(),
    169: new Card169(),
    170: new Card170(),
    171: new Card171(),
    172: new Card172(),
    173: new Card173(),
    174: new Card174(),
    175: new Card175(),
    176: new Card176(),
    177: new Card177(),
    178: new Card178(),
    179: new Card179(),
    180: new Card180(),
    181: new Card181(),
    182: new Card182(),
    183: new Card183(),
    184: new Card184(),
    185: new Card185(),
    186: new Card186(),
    187: new Card187(),
    188: new Card188(),
    203: new Card203(),
    205: new Card205(),
    207: new Card207(),
    208: new Card208(),
    209: new Card209(),
    210: new Card210(),
    211: new Card211(),
    212: new Card212(),
    213: new Card213(),
    214: new Card214(),
    216: new Card216(),
    217: new Card217(),
    219: new Card219(),
    220: new Card220(),
    221: new Card221(),
    222: new Card222(),
    223: new Card223(),
    224: new Card224(),
    225: new Card225(),
    226: new Card226(),
    228: new Card228(),
    229: new Card229(),
    230: new Card230(),
    231: new Card231(),
    232: new Card232(),
    233: new Card233(),
    234: new Card234(),
    235: new Card235(),
    236: new Card236(),
    237: new Card237(),
    238: new Card238(),
    239: new Card239(),
    240: new Card240(),
    241: new Card241(),
    242: new Card242(),
    243: new Card243(),
    244: new Card244(),
    245: new Card245(),
    301: new Card301(),
    302: new Card302(),
    303: new Card303(),
    304: new Card304(),
    305: new Card305(),
    306: new Card306(),
    308: new Card308(),
    309: new Card309(),
    310: new Card310(),
    311: new Card311(),
    312: new Card312(),
    313: new Card313(),
    314: new Card314(),
    315: new Card315(),
    316: new Card316(),
    317: new Card317(),
    318: new Card318(),
    319: new Card319(),
    320: new Card320(),
    321: new Card321(),
    323: new Card323(),
    324: new Card324(),
    325: new Card325(),
    326: new Card326(),
    327: new Card327(),
    328: new Card328(),
    329: new Card329(),
    330: new Card330(),
    331: new Card331(),
    333: new Card333(),
    334: new Card334(),
    335: new Card335(),
    336: new Card336(),
    337: new Card337(),
    338: new Card338(),
    339: new Card339(),
    340: new Card340(),
    341: new Card341(),
    342: new Card342(),
    343: new Card343(),
    344: new Card344(),
    345: new Card345(),
    346: new Card346(),
    347: new Card347(),
    348: new Card348(),
    349: new Card349(),
    350: new Card350(),
    351: new Card351(),
    352: new Card352(),
    353: new Card353(),
    401: new Card401(),
    403: new Card403(),
    404: new Card404(),
    405: new Card405(),
    406: new Card406(),
    409: new Card409(),
    410: new Card410(),
    412: new Card412(),
    413: new Card413(),
    414: new Card414(),
    416: new Card416(),
    417: new Card417(),
    418: new Card418(),
    419: new Card419(),
    420: new Card420(),
    421: new Card421(),
    422: new Card422(),
    423: new Card423(),
    424: new Card424(),
    426: new Card426(),
    427: new Card427(),
    428: new Card428(),
    429: new Card429(),
    430: new Card430(),
    432: new Card432(),
    433: new Card433(),
    434: new Card434(),
    435: new Card435(),
    436: new Card436(),
    438: new Card438(),
    439: new Card439(),
    440: new Card440(),
    441: new Card441(),
    443: new Card443(),
    444: new Card444(),
    445: new Card445(),
    446: new Card446(),
    447: new Card447(),
    448: new Card448(),
    449: new Card449(),
    450: new Card450(),
    451: new Card451(),
    452: new Card452(),
    453: new Card453(),
    501: new Card501(),
    504: new Card504(),
    509: new Card509(),
    517: new Card517(),
    522: new Card522(),
    524: new Card524(),
    525: new Card525(),
    526: new Card526(),
    528: new Card528(),
    529: new Card529(),
    530: new Card530(),
    531: new Card531(),
    532: new Card532(),
    533: new Card533(),
    534: new Card534(),
    537: new Card534(),
    542: new Card542(),
    545: new Card545(),
    550: new Card550(),
    554: new Card554(),
    555: new Card555(),
    559: new Card559()
  };

  static allCards = Object.values(this.cards);
  static starterDecks: Card[][] = starterDecks.map(sd =>
    sd
      .map(c => Array(c[0]).fill(c[1]))
      .flat()
      .map(cid => this.cards[cid as keyof typeof this.cards])
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
        }
      });
    return relevantCards[Math.floor(Math.random() * relevantCards.length)];
  }
}
