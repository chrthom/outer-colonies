import ColonyCard from '../types/colony_card';
import { Card160, Card186, Card220, Card243, Card342, Card348, Card351, Card436, Card439, Card450 } from './hull_1_part_cards';
import { Card103, Card140, Card163, Card170, Card171, Card184, Card240, Card349, Card406, Card447 } from './equipment_defense_cards';
import { Card130, Card168, Card181, Card234, Card237, Card339, Card340, Card424, Card440, Card441 } from './equipment_weapon_point_defense_cards';
import { Card135, Card154, Card164, Card183 } from './infrastructure_action_cards';
import { Card105, Card145, Card185, Card187, Card188, Card242, Card244, Card245, Card350, Card352, Card353, Card451, Card452, Card453 } from './infrastructure_energy_cards';
import { Card141, Card165, Card232, Card321, Card427 } from './tactic_economy_cards';
import { Card119, Card152, Card153, Card228, Card446 } from './hull_staton_cards';
import { Card166, Card182, Card343, Card344, Card347, Card421 } from './equipment_weapon_laser_cards';
import { Card126, Card151, Card179, Card180, Card223, Card310, Card420 } from './equipment_weapon_kinetic_cards';
import { Card109, Card161, Card434, Card449 } from './equipment_util_cards';
import { Card118, Card125, Card157, Card209, Card303, Card409 } from './equipment_weapon_plasma_cards';
import { Card106, Card107, Card207 } from './equipment_weapon_particle_cards';
import { Card101, Card127, Card136, Card216, Card304, Card412 } from './equipment_weapon_torpedo_cards';
import { Card131, Card132, Card177, Card178, Card213, Card221, Card226, Card326, Card327, Card328, Card329, Card418, Card444, Card445 } from './hull_2_part_cards';
import { Card116, Card117, Card120, Card121, Card122, Card133, Card134, Card306, Card308, Card309, Card313, Card314, Card315 } from './hull_3_part_cards';
import { Card174, Card337, Card338 } from './tactic_military_cards';
import { Card110 } from './tactic_science_cards';
import Card from '../card';
import { Card172 } from './infrastructure_util.cards';

export default class CardCollection {
    static cards = {
        0: new ColonyCard(),
        101: new Card101(),
        103: new Card103(),
        105: new Card105(),
        106: new Card106(),
        107: new Card107(),
        109: new Card109(),
        110: new Card110(),
        116: new Card116(),
        117: new Card117(),
        118: new Card118(),
        119: new Card119(),
        120: new Card120(),
        121: new Card121(),
        122: new Card122(),
        125: new Card125(),
        126: new Card126(),
        127: new Card127(),
        130: new Card130(),
        131: new Card131(),
        132: new Card132(),
        133: new Card133(),
        134: new Card134(),
        135: new Card135(),
        136: new Card136(),
        140: new Card140(),
        141: new Card141(),
        145: new Card145(),
        151: new Card151(),
        152: new Card152(),
        153: new Card153(),
        154: new Card154(),
        157: new Card157(),
        160: new Card160(),
        161: new Card161(),
        163: new Card163(),
        164: new Card164(),
        165: new Card165(),
        166: new Card166(),
        168: new Card168(),
        170: new Card170(),
        171: new Card171(),
        172: new Card172(),
        174: new Card174(),
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
        207: new Card207(),
        209: new Card209(),
        213: new Card213(),
        216: new Card216(),
        220: new Card220(),
        221: new Card221(),
        223: new Card223(),
        226: new Card226(),
        228: new Card228(),
        232: new Card232(),
        234: new Card234(),
        237: new Card237(),
        240: new Card240(),
        242: new Card242(),
        243: new Card243(),
        244: new Card244(),
        245: new Card245(),
        303: new Card303(),
        304: new Card304(),
        306: new Card306(),
        308: new Card308(),
        309: new Card309(),
        310: new Card310(),
        313: new Card313(),
        314: new Card314(),
        315: new Card315(),
        321: new Card321(),
        326: new Card326(),
        327: new Card327(),
        328: new Card328(),
        329: new Card329(),
        337: new Card337(),
        338: new Card338(),
        339: new Card339(),
        340: new Card340(),
        342: new Card342(),
        343: new Card343(),
        344: new Card344(),
        347: new Card347(),
        348: new Card348(),
        349: new Card349(),
        350: new Card350(),
        351: new Card351(),
        352: new Card352(),
        353: new Card353(),
        406: new Card406(),
        409: new Card409(),
        412: new Card412(),
        418: new Card418(),
        420: new Card420(),
        421: new Card421(),
        424: new Card424(),
        427: new Card427(),
        434: new Card434(),
        436: new Card436(),
        439: new Card439(),
        440: new Card440(),
        441: new Card441(),
        444: new Card444(),
        445: new Card445(),
        446: new Card446(),
        447: new Card447(),
        449: new Card449(),
        450: new Card450(),
        451: new Card451(),
        452: new Card452(),
        453: new Card453(),
    };

    static allCards = Object.values(this.cards);

    static starterDeckSettlers: Card[] = [
        // Hull (18)
        Array(6).fill(this.cards[186]), // Korvette
        Array(4).fill(this.cards[160]), // Leichter Frachter
        Array(3).fill(this.cards[177]), // Zerstörer
        Array(3).fill(this.cards[178]), // Zerstörer
        Array(2).fill(this.cards[446]), // Außenposten
        // Equipment (29 - 17/23 Theta, 2/3 Xi, 2/3 Phi)
        Array(2).fill(this.cards[340]), // Abfangraketenwerfer
        Array(2).fill(this.cards[347]), // Impulslaser
        Array(6).fill(this.cards[441]), // Flechettewerfer
        Array(4).fill(this.cards[234]), // Punktabwehrlaser
        Array(7).fill(this.cards[237]), // Fokus-Laser
        Array(4).fill(this.cards[170]), // Strahlenschilde
        Array(4).fill(this.cards[184]), // Rumpferweiterung
        // Infrastructure (8)
        Array(3).fill(this.cards[185]), // Kraftwerk
        Array(3).fill(this.cards[183]), // Industriekomplex
        Array(2).fill(this.cards[172]), // Ressourcensilo
        // Tactic (7)
        Array(4).fill(this.cards[232]), // Warenlieferung
        Array(3).fill(this.cards[321]), // Recycling
        // TEST CARDS
    ].flat();
    
    static starterDeckTraders: Card[] = [
        // Hull (18)
        Array(6).fill(this.cards[243]), // Korvette
        Array(4).fill(this.cards[348]), // Kanonenboot
        Array(3).fill(this.cards[221]), // Schwerer Frachter
        Array(3).fill(this.cards[327]), // Schwerer Frachter
        Array(2).fill(this.cards[446]), // Außenposten
        // Equipment (28 - 16/19 Theta, 4/4 Xi)
        Array(4).fill(this.cards[180]), // Railgun
        Array(5).fill(this.cards[237]), // Mini-Railgun
        Array(3).fill(this.cards[339]), // Gatling
        Array(8).fill(this.cards[166]), // Laserkanone
        Array(5).fill(this.cards[240]), // Ceramo-Stahl
        Array(3).fill(this.cards[171]), // Titanplattenpanzer
        // Infrastructure (3)
        Array(3).fill(this.cards[172]), // Ressourcensilo
        // Tactic (14)
        Array(7).fill(this.cards[337]), // Militärpioniere
        Array(4).fill(this.cards[165]), // Konvoi
        Array(3).fill(this.cards[321]), // Recycling
        // TEST CARDS
    ].flat();
    
    static starterDeckExpedition: Card[] = [
        // Hull (18)
        Array(6).fill(this.cards[351]), // Korvette
        Array(4).fill(this.cards[439]), // Mittelschwerer Frachter
        Array(3).fill(this.cards[444]), // Zerstörer
        Array(3).fill(this.cards[445]), // Zerstörer
        Array(2).fill(this.cards[446]), // Außenposten
        // Equipment (24 - 16/23 Theta, 2/3 Xi, 2/3 Phi)
        Array(2).fill(this.cards[340]), // Abfangraketenwerfer
        Array(2).fill(this.cards[182]), // Dual-Lasergeschütz
        Array(6).fill(this.cards[440]), // Impulskanone
        Array(4).fill(this.cards[168]), // Automatikkanone
        Array(4).fill(this.cards[179]), // Pulskanone
        Array(2).fill(this.cards[343]), // Laserphalanx
        Array(4).fill(this.cards[163]), // Verbundpanzerung
        // Infrastructure (10)
        Array(6).fill(this.cards[187]), // Atomreaktor
        Array(1).fill(this.cards[453]), // Kraftwerk
        Array(3).fill(this.cards[164]), // Rüstungsschmiede
        // Tactic (8)
        Array(2).fill(this.cards[337]), // Militärpioniere
        Array(3).fill(this.cards[338]), // Nachschub
        Array(3).fill(this.cards[321]), // Recycling
        // TEST CARDS
    ].flat();

    static starterDecks: Card[][] = [ this.starterDeckSettlers, this.starterDeckTraders, this.starterDeckExpedition ]

    static pickRandomDeck(): Card[] {
        return this.starterDecks[Math.floor(Math.random() * this.starterDecks.length)].slice();
    }
}
